import { afterAll, afterEach, beforeAll, beforeEach, expect, jest, test } from "@jest/globals";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createDeviceTokenStore } from "../models/deviceToken";
import { createNotificationStore } from "../models/notification";
import { createMongoPushSubscriptionStore } from "../models/pushSubscription";
import Schedule, { type DayOfWeek } from "../models/Schedule";
import User from "../models/User";
import authMiddleware from "../middleware/authMiddleware";
import { request } from "./http";

jest.mock("../utils/sendEmail", () => ({
  __esModule: true,
  default: jest.fn(async () => undefined),
}));
jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(async () => [{ address: "8.8.8.8", family: 4 }]),
}));

const authRoutes = require("../routes/authRoutes").default as typeof import("../routes/authRoutes").default;
const userRoutes = require("../routes/userRoutes").default as typeof import("../routes/userRoutes").default;
const scheduleRoutes = require("../routes/scheduleRoutes").default as typeof import("../routes/scheduleRoutes").default;
const { createNotificationRouter } = require("../routes/notificationRoutes") as typeof import("../routes/notificationRoutes");
const sendEmail = require("../utils/sendEmail").default as jest.MockedFunction<
  typeof import("../utils/sendEmail").default
>;

const jwtSecret = "backend-integration-test-secret";
const testPassword = "StrongPass1!";
let mongoServer: MongoMemoryServer;
let app: express.Express;
let notificationCollection: mongoose.mongo.Collection;
let deviceTokenCollection: mongoose.mongo.Collection;
const deliveredPushPayloads: string[] = [];

function authorization(userId: string): Record<string, string> {
  const token = jwt.sign({ userId }, jwtSecret, { algorithm: "HS256" });
  return { authorization: `Bearer ${token}` };
}

function jsonRequest(userId: string, body: unknown, method = "POST") {
  return {
    method,
    headers: { ...authorization(userId), "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function todayWeekday(): DayOfWeek {
  const weekdays: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return weekdays[new Date().getDay()];
}

async function createVerifiedUser(username: string, email: string, streakCount = 0) {
  return User.create({
    username,
    email,
    password: "already-hashed-for-test",
    isVerified: true,
    streakCount,
  });
}

beforeAll(async () => {
  process.env.JWT_SECRET = jwtSecret;
  mongoServer = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
    instance: { dbName: "gymbros-integration" },
  });
  await mongoose.connect(mongoServer.getUri(), { serverSelectionTimeoutMS: 5_000 });
  await Promise.all([User.init(), Schedule.init()]);

  const database = mongoose.connection.db;
  if (!database) throw new Error("Integration database connection is unavailable");
  notificationCollection = database.collection("notifications");
  deviceTokenCollection = database.collection("deviceTokens");

  app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/schedules", scheduleRoutes);
  app.use("/api/notifications", createNotificationRouter({
    store: createMongoPushSubscriptionStore(database),
    notificationStore: createNotificationStore(notificationCollection),
    deviceTokenStore: createDeviceTokenStore(deviceTokenCollection),
    authenticationMiddleware: authMiddleware,
    nativePushSender: {
      async send(tokens) {
        return tokens.filter((token) => token.startsWith("expired-"));
      },
    },
    allowDevTest: true,
    pushClient: {
      async sendNotification(_subscription, payload) {
        deliveredPushPayloads.push(payload);
      },
    },
  }));
}, 120_000);

beforeEach(async () => {
  sendEmail.mockClear();
  deliveredPushPayloads.length = 0;
  await Promise.all([
    User.deleteMany({}),
    Schedule.deleteMany({}),
    notificationCollection.deleteMany({}),
    deviceTokenCollection.deleteMany({}),
  ]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30_000);

test("signup, email verification, login, and protected profile use the same persisted user", async () => {
  const signup = await request(app, "/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "integration-bro", email: "integration@example.com", password: testPassword }),
  });
  expect(signup.status).toBe(201);

  const verificationEmail = sendEmail.mock.calls[0]?.[2];
  expect(verificationEmail).toContain("/api/auth/verify-email?token=");
  const rawToken = verificationEmail.match(/[?&]token=([a-f0-9]+)/)?.[1];
  expect(rawToken).toBeDefined();
  const storedBeforeVerification = await User.findOne({ email: "integration@example.com" });
  expect(storedBeforeVerification?.verificationToken).not.toBe(rawToken);

  const verified = await request(app, `/api/auth/verify-email?token=${rawToken}`);
  expect(verified.status).toBe(200);
  const login = await request(app, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: "integration-bro", password: testPassword }),
  });
  expect(login.status).toBe(200);
  const loginBody = await login.json() as { token: string };
  const loggedInUserId = (jwt.verify(loginBody.token, jwtSecret) as jwt.JwtPayload).userId as string;

  const profile = await request(app, "/api/auth/me", {
    headers: authorization(loggedInUserId),
  });
  expect(profile.status).toBe(200);
  await expect(profile.json()).resolves.toMatchObject({
    username: "integration-bro",
    email: "integration@example.com",
  });
  expect(await User.countDocuments({ username: "integration-bro", isVerified: true })).toBe(1);

  const updated = await request(app, "/api/auth/me", jsonRequest(loggedInUserId, {
    name: "Integration Athlete",
    username: "integration-athlete",
    currentPassword: testPassword,
    password: "UpdatedPass2!",
  }, "PATCH"));
  expect(updated.status).toBe(200);
  expect(await User.countDocuments({ username: "integration-athlete", name: "Integration Athlete" })).toBe(1);

  const updatedLogin = await request(app, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "integration@example.com", password: "UpdatedPass2!" }),
  });
  expect(updatedLogin.status).toBe(200);
});

test("resend verification and password recovery update the persisted account", async () => {
  await User.create({
    username: "recovery-bro",
    email: "recovery@example.com",
    password: "old-password-hash",
    isVerified: false,
  });

  const resent = await request(app, "/api/auth/resend-verification", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "recovery@example.com" }),
  });
  expect(resent.status).toBe(200);
  const verificationEmail = sendEmail.mock.calls[0]?.[2] ?? "";
  const verificationToken = verificationEmail.match(/[?&]token=([a-f0-9]+)/)?.[1];
  expect(verificationToken).toBeDefined();
  const verified = await request(app, `/api/auth/verify-email?token=${verificationToken}`);
  expect(verified.status).toBe(200);

  const forgotPassword = await request(app, "/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "recovery@example.com" }),
  });
  expect(forgotPassword.status).toBe(200);
  const resetEmail = sendEmail.mock.calls[1]?.[2] ?? "";
  const resetToken = resetEmail.match(/reset-password\?token=([a-f0-9]+)/)?.[1];
  expect(resetToken).toBeDefined();

  const reset = await request(app, "/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: resetToken, password: "RecoveredPass3!" }),
  });
  expect(reset.status).toBe(200);
  expect((await User.findOne({ email: "recovery@example.com" }))?.resetPasswordToken).toBeNull();

  const login = await request(app, "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "recovery@example.com", password: "RecoveredPass3!" }),
  });
  expect(login.status).toBe(200);
});

test("search, friend management, friend stats, and today's friend workouts share Mongo persistence", async () => {
  const owner = await createVerifiedUser("owner-bro", "owner@example.com");
  const friend = await createVerifiedUser("lifting-bro", "lifting@example.com", 12);
  const weekday = todayWeekday();
  await Schedule.create({
    userId: friend._id,
    dayOfWeek: weekday,
    startTime: "8:00 AM",
    endTime: "9:00 AM",
    activity: "Lift",
  });

  const search = await request(app, "/api/users/search?q=lifting", {
    headers: authorization(owner.id),
  });
  expect(search.status).toBe(200);
  await expect(search.json()).resolves.toEqual([
    expect.objectContaining({ username: "lifting-bro", email: "lifting@example.com" }),
  ]);

  const added = await request(app, `/api/users/${owner.id}/friends/${friend.id}`, jsonRequest(owner.id, {}));
  expect(added.status).toBe(201);
  expect((await User.findById(owner.id))?.friends.map(({ friendId }) => friendId.toString())).toContain(friend.id);

  const stats = await request(app, `/api/users/${owner.id}/friends/stats`, {
    headers: authorization(owner.id),
  });
  expect(stats.status).toBe(200);
  await expect(stats.json()).resolves.toMatchObject({
    highestStreakFriend: { friendId: friend.id, username: "lifting-bro", streakCount: 12 },
    mostBuggedFriend: { friendId: friend.id },
  });

  const workouts = await request(app, `/api/users/${owner.id}/friends/workouts/today`, {
    headers: authorization(owner.id),
  });
  expect(workouts.status).toBe(200);
  await expect(workouts.json()).resolves.toEqual([
    expect.objectContaining({ friendId: friend.id, workouts: [expect.objectContaining({ activity: "Lift" })] }),
  ]);

  const removed = await request(app, `/api/users/${owner.id}/friends/${friend.id}`, {
    method: "DELETE",
    headers: authorization(owner.id),
  });
  expect(removed.status).toBe(200);
  expect((await User.findById(owner.id))?.friends).toHaveLength(0);
});

test("schedule create, list, completion, update, and delete persist through HTTP routes", async () => {
  const user = await createVerifiedUser("schedule-bro", "schedule@example.com");
  const weekday = todayWeekday();

  const created = await request(app, "/api/schedules", jsonRequest(user.id, {
    dayOfWeek: weekday,
    startTime: " 8:00 AM ",
    endTime: "9:00 AM",
    activity: "  Lift  ",
  }));
  expect(created.status).toBe(201);
  const entry = await created.json() as { _id: string; activity: string };
  expect(entry.activity).toBe("Lift");
  expect(await Schedule.countDocuments({ userId: user._id })).toBe(1);

  const listed = await request(app, "/api/schedules", { headers: authorization(user.id) });
  expect(listed.status).toBe(200);
  expect(await listed.json()).toEqual([expect.objectContaining({ _id: entry._id, activity: "Lift" })]);

  const completed = await request(app, `/api/schedules/${entry._id}/completion`, jsonRequest(user.id, {
    isCompletedToday: true,
  }, "PATCH"));
  expect(completed.status).toBe(200);
  expect((await Schedule.findById(entry._id))?.isCompletedToday).toBe(true);

  const today = await request(app, "/api/schedules/today", { headers: authorization(user.id) });
  expect(await today.json()).toEqual([expect.objectContaining({ _id: entry._id, isCompletedToday: true })]);

  const updated = await request(app, `/api/schedules/${entry._id}`, jsonRequest(user.id, {
    activity: "Conditioning",
  }, "PATCH"));
  expect(updated.status).toBe(200);
  expect((await Schedule.findById(entry._id))?.activity).toBe("Conditioning");

  const deleted = await request(app, `/api/schedules/${entry._id}`, {
    method: "DELETE",
    headers: authorization(user.id),
  });
  expect(deleted.status).toBe(200);
  expect(await Schedule.countDocuments({ userId: user._id })).toBe(0);
});

test("friend bug notifications persist to the recipient inbox and device tokens persist in MongoDB", async () => {
  const sender = await createVerifiedUser("sender-bro", "sender@example.com");
  const recipient = await createVerifiedUser("recipient-bro", "recipient@example.com");
  await User.updateOne({ _id: sender._id }, { $push: { friends: { friendId: recipient._id } } });

  const expiredToken = await request(app, "/api/notifications/device-token", jsonRequest(recipient.id, {
    token: "expired-device-token",
    platform: "ios",
  }));
  expect(expiredToken.status).toBe(204);
  expect(await deviceTokenCollection.countDocuments({ userId: recipient.id, token: "expired-device-token" })).toBe(1);

  const bug = await request(app, `/api/notifications/friends/${recipient.id}/bug`, jsonRequest(sender.id, {}));
  expect(bug.status).toBe(201);
  expect((await User.findById(sender.id))?.friends[0]?.bugCount).toBe(1);

  const congratulated = await request(app, `/api/notifications/friends/${recipient.id}/congratulate`, jsonRequest(sender.id, {}));
  expect(congratulated.status).toBe(201);
  expect((await User.findById(sender.id))?.friends[0]?.bugCount).toBe(1);

  const inbox = await request(app, "/api/notifications/inbox", { headers: authorization(recipient.id) });
  expect(inbox.status).toBe(200);
  const inboxBody = await inbox.json() as { notifications: Array<{ id: string; title: string; read: boolean }> };
  expect(inboxBody.notifications.map(({ title }) => title)).toEqual(expect.arrayContaining([
    "Your bro is checking in!",
    "Congratulations, bro!",
  ]));

  const bugNotification = inboxBody.notifications.find(({ title }) => title === "Your bro is checking in!");
  expect(bugNotification).toBeDefined();
  const marked = await request(app, `/api/notifications/inbox/${bugNotification?.id}/read`, {
    method: "PATCH",
    headers: authorization(recipient.id),
  });
  expect(marked.status).toBe(204);
  const unread = await request(app, "/api/notifications/inbox?unreadOnly=true", {
    headers: authorization(recipient.id),
  });
  const unreadBody = await unread.json() as { notifications: Array<{ id: string; title: string }> };
  expect(unreadBody.notifications).toEqual([
    expect.objectContaining({ title: "Congratulations, bro!" }),
  ]);
  const congratulation = unreadBody.notifications[0];
  const markedCongratulation = await request(app, `/api/notifications/inbox/${congratulation.id}/read`, {
    method: "PATCH",
    headers: authorization(recipient.id),
  });
  expect(markedCongratulation.status).toBe(204);
  const allRead = await request(app, "/api/notifications/inbox?unreadOnly=true", {
    headers: authorization(recipient.id),
  });
  await expect(allRead.json()).resolves.toEqual({ notifications: [] });

  const tokensAfterPush = await deviceTokenCollection.find({ userId: recipient.id }).toArray();
  expect(tokensAfterPush).toHaveLength(0);
});

test("browser push, direct notification, and device-token routes use Mongo-backed stores", async () => {
  const sender = await createVerifiedUser("push-sender", "push-sender@example.com");
  const recipient = await createVerifiedUser("push-recipient", "push-recipient@example.com");
  const subscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/integration-subscription",
    keys: { p256dh: "public-key", auth: "auth-key" },
  };

  const subscribed = await request(app, "/api/notifications/subscribe", jsonRequest(recipient.id, { subscription }));
  expect(subscribed.status).toBe(201);
  expect(await mongoose.connection.db?.collection("pushSubscriptions").countDocuments({ userId: recipient.id })).toBe(1);

  const sent = await request(app, "/api/notifications/send", jsonRequest(sender.id, {
    targetUserId: recipient.id,
    messageText: "Integration push",
  }));
  expect(sent.status).toBe(200);
  expect(JSON.parse(deliveredPushPayloads[0])).toMatchObject({ body: "Integration push" });

  const testPush = await request(app, "/api/notifications/test", jsonRequest(recipient.id, {}));
  expect(testPush.status).toBe(200);
  expect(JSON.parse(deliveredPushPayloads[1])).toMatchObject({ title: "GymBros Test" });

  const created = await request(app, "/api/notifications", jsonRequest(sender.id, {
    targetUserId: recipient.id,
    title: "Direct integration notice",
    message: "Persist this notification.",
  }));
  expect(created.status).toBe(201);
  expect(await notificationCollection.countDocuments({ userId: recipient.id })).toBe(1);

  const unread = await request(app, "/api/notifications/inbox?unreadOnly=true", {
    headers: authorization(recipient.id),
  });
  const unreadBody = await unread.json() as { notifications: Array<{ title: string }> };
  expect(unreadBody.notifications[0]).toMatchObject({ title: "Direct integration notice" });

  const tokenSaved = await request(app, "/api/notifications/device-token", jsonRequest(recipient.id, {
    token: "valid-device-token",
    platform: "android",
  }));
  expect(tokenSaved.status).toBe(204);
  const tokenDeleted = await request(app, "/api/notifications/device-token", jsonRequest(recipient.id, {
    token: "valid-device-token",
  }, "DELETE"));
  expect(tokenDeleted.status).toBe(204);
  expect(await deviceTokenCollection.countDocuments({ userId: recipient.id })).toBe(0);
});