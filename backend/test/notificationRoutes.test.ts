//AI-assisted: Initial implementation suggested by Copilot (reviewed and modified)
import { afterAll, beforeAll, expect, jest, test } from "@jest/globals";
import express from "express";
import {
  createInMemoryNotificationStore,
} from "../models/notification";
import {
  createInMemoryPushSubscriptionStore,
  type PushSubscription,
} from "../models/pushSubscription";
import type { DeviceTokenStore } from "../models/deviceToken";
import type { NativePushSender } from "../services/firebaseNotifications";
import { createNotificationRouter } from "../routes/notificationRoutes";
import { request } from "./http";

const subscription: PushSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test-subscription",
  keys: { p256dh: "public-key", auth: "auth-key" },
};
const originalDevHeader = process.env.ALLOW_DEV_USER_HEADER;

function createTestApp(options: {
  sendNotification?: (subscription: PushSubscription, payload: string) => Promise<void>;
  nativePushSender?: NativePushSender;
} = {}) {
  const store = createInMemoryPushSubscriptionStore();
  const notificationStore = createInMemoryNotificationStore();
  const deviceTokens: Array<{ userId: string; token: string; platform: string }> = [];
  const deviceTokenStore: DeviceTokenStore = {
    async save(userId, token, platform) {
      if (typeof token !== "string" || (platform !== "android" && platform !== "ios")) {
        throw new TypeError("invalid device token");
      }
      deviceTokens.push({ userId, token, platform });
    },
    async delete(userId, token) {
      const index = deviceTokens.findIndex((entry) => entry.userId === userId && entry.token === token);
      if (index >= 0) deviceTokens.splice(index, 1);
    },
    async list(userId) {
      return deviceTokens.filter((entry) => entry.userId === userId).map((entry) => entry.token);
    },
  };
  const app = express();
  app.use(express.json());
  app.use("/api/notifications", createNotificationRouter({
    store,
    notificationStore,
    deviceTokenStore,
    nativePushSender: options.nativePushSender,
    pushClient: { sendNotification: options.sendNotification ?? (async () => undefined) },
    allowDevTest: true,
  }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ message: error instanceof Error ? error.message : "Unexpected error" });
  });
  return { app, store, deviceTokens };
}

function jsonOptions(userId: string, body: unknown, method = "POST") {
  return {
    method,
    headers: { "content-type": "application/json", "x-user-id": userId },
    body: JSON.stringify(body),
  };
}

beforeAll(() => {
  process.env.ALLOW_DEV_USER_HEADER = "true";
});

afterAll(() => {
  if (originalDevHeader === undefined) delete process.env.ALLOW_DEV_USER_HEADER;
  else process.env.ALLOW_DEV_USER_HEADER = originalDevHeader;
});

test("requires authentication and validates browser subscriptions", async () => {
  const setup = createTestApp();
  const unauthenticated = await request(setup.app, "/api/notifications/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscription }),
  });
  expect(unauthenticated.status).toBe(401);

  const invalid = await request(setup.app, "/api/notifications/subscribe", jsonOptions("user-1", { subscription: {} }));
  expect(invalid.status).toBe(400);
});

test("subscribes a browser and delivers a push notification", async () => {
  let sentPayload: Record<string, unknown> | undefined;
  const setup = createTestApp({
    sendNotification: async (_subscription, payload) => {
      sentPayload = JSON.parse(payload) as Record<string, unknown>;
    },
  });
  const saved = await request(setup.app, "/api/notifications/subscribe", jsonOptions("recipient", { subscription }));
  expect(saved.status).toBe(201);

  const sent = await request(setup.app, "/api/notifications/send", jsonOptions("sender", {
    targetUserId: " recipient ",
    messageText: " Time to train! ",
  }));
  expect(sent.status).toBe(200);
  expect(sentPayload).toEqual({ title: "GymBros Notification", body: "Time to train!", url: "/" });
});

test("removes expired browser subscriptions", async () => {
  const setup = createTestApp({
    sendNotification: async () => {
      throw Object.assign(new Error("expired"), { statusCode: 410 });
    },
  });
  await setup.store.save("recipient", subscription);

  const response = await request(setup.app, "/api/notifications/send", jsonOptions("sender", {
    targetUserId: "recipient",
    messageText: "Hello",
  }));

  expect(response.status).toBe(410);
  await expect(setup.store.findByUserId("recipient")).resolves.toBeNull();
});

test("creates, lists, and marks in-app notifications read", async () => {
  const setup = createTestApp();
  const created = await request(setup.app, "/api/notifications", jsonOptions("sender", {
    targetUserId: "recipient",
    title: "Friend request",
    message: "You have a new friend request.",
  }));
  expect(created.status).toBe(201);
  const createdBody = await created.json() as { notification: { id: string; read: boolean } };
  expect(createdBody.notification.read).toBe(false);

  const listed = await request(setup.app, "/api/notifications/inbox", {
    headers: { "x-user-id": "recipient" },
  });
  expect(listed.status).toBe(200);
  expect((await listed.json() as { notifications: unknown[] }).notifications).toHaveLength(1);

  const marked = await request(setup.app, `/api/notifications/inbox/${createdBody.notification.id}/read`, {
    method: "PATCH",
    headers: { "x-user-id": "recipient" },
  });
  expect(marked.status).toBe(204);
  const unread = await request(setup.app, "/api/notifications/inbox?unreadOnly=true", {
    headers: { "x-user-id": "recipient" },
  });
  expect(await unread.json()).toEqual({ notifications: [] });
});

test("validates device tokens and removes invalid native tokens", async () => {
  const invalidToken = await request(createTestApp().app, "/api/notifications/device-token", jsonOptions("user", {
    token: "token",
    platform: "desktop",
  }));
  expect(invalidToken.status).toBe(400);

  let sentTokens: string[] = [];
  const nativePushSender: NativePushSender = {
    async send(tokens) {
      sentTokens = tokens;
      return ["expired-token"];
    },
  };
  const setup = createTestApp({ nativePushSender });
  for (const token of ["expired-token", "valid-token"]) {
    await request(setup.app, "/api/notifications/device-token", jsonOptions("recipient", { token, platform: "android" }));
  }
  const delivered = await request(setup.app, "/api/notifications", jsonOptions("sender", {
    targetUserId: "recipient",
    title: "Workout reminder",
    message: "Time to train!",
  }));

  expect(delivered.status).toBe(201);
  expect(sentTokens).toEqual(["expired-token", "valid-token"]);
  expect(setup.deviceTokens).toEqual([{ userId: "recipient", token: "valid-token", platform: "android" }]);
});

test("sends a test push to the authenticated user's subscription", async () => {
  let sentPayload: Record<string, unknown> | undefined;
  const setup = createTestApp({
    sendNotification: async (_subscription, payload) => {
      sentPayload = JSON.parse(payload) as Record<string, unknown>;
    },
  });
  await setup.store.save("user", subscription);

  const response = await request(setup.app, "/api/notifications/test", jsonOptions("user", {}));

  expect(response.status).toBe(200);
  expect(sentPayload).toEqual({ title: "GymBros Test", body: "Time to train!", url: "/" });
});
