import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { test } from "node:test";
import {
  createInMemoryPushSubscriptionStore,
  type PushSubscription,
} from "../models/pushSubscription.js";
import { createInMemoryNotificationStore } from "../models/notification.js";
import type { NotificationStore } from "../models/notification.js";
import type { DeviceTokenStore } from "../models/deviceToken.js";
import type { NativePushSender } from "../services/firebaseNotifications.js";
import { createNotificationRouter } from "../routes/notificationRoutes.js";

process.env.ALLOW_DEV_USER_HEADER = "true";

function createTestServer(
  sendNotification: (subscription: PushSubscription, payload: string) => Promise<void> = async () => undefined,
  nativePushSender?: NativePushSender,
) {
  const app = express();
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
      const index = deviceTokens.findIndex(
        (entry) => entry.userId === userId && entry.token === token,
      );
      if (index >= 0) deviceTokens.splice(index, 1);
    },
    async list(userId) {
      return deviceTokens
        .filter((entry) => entry.userId === userId)
        .map((entry) => entry.token);
    },
  };
  app.use(express.json());
  app.use("/api/notifications", createNotificationRouter({
    store,
    notificationStore,
    deviceTokenStore,
    nativePushSender,
    pushClient: { sendNotification },
    allowDevTest: true,
  }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    res.status(500).json({ message });
  });
  const server = http.createServer(app);
  return { server, store, notificationStore, deviceTokens };
}

async function request(
  server: http.Server,
  path: string,
  options: RequestInit = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const address = await new Promise<{ port: number }>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, () => {
      const currentAddress = server.address();
      if (!currentAddress || typeof currentAddress === "string") {
        reject(new Error("Test server did not expose a TCP address"));
        return;
      }
      resolve({ port: currentAddress.port });
    });
  });

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? (JSON.parse(text) as Record<string, unknown>) : {},
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const subscription: PushSubscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test-subscription",
  keys: { p256dh: "public-key", auth: "auth-key" },
};

test("requires authentication and validates subscriptions", async () => {
  const unauthenticated = await request(
    createTestServer().server,
    "/api/notifications/subscribe",
    { method: "POST", body: JSON.stringify({ subscription }) },
  );
  assert.equal(unauthenticated.status, 401);

  const invalid = await request(
    createTestServer().server,
    "/api/notifications/subscribe",
    {
      method: "POST",
      headers: { "x-user-id": "user-1" },
      body: JSON.stringify({ subscription: {} }),
    },
  );
  assert.equal(invalid.status, 400);
});

test("saves a subscription and sends a notification", async () => {
  let sentPayload: Record<string, unknown> | undefined;
  const server = createTestServer(async (_subscription, payload) => {
    sentPayload = JSON.parse(payload) as Record<string, unknown>;
  });
  const saved = await request(server.server, "/api/notifications/subscribe", {
    method: "POST",
    headers: { "x-user-id": "user-2" },
    body: JSON.stringify({ subscription }),
  });
  assert.equal(saved.status, 201);

  const sendServer = createTestServer(async (_subscription, payload) => {
    sentPayload = JSON.parse(payload) as Record<string, unknown>;
  });
  await sendServer.store.save("user-2", subscription);
  const sent = await request(sendServer.server, "/api/notifications/send", {
    method: "POST",
    headers: { "x-user-id": "sender-1" },
    body: JSON.stringify({ targetUserId: "user-2", messageText: "Time to train!" }),
  });
  assert.equal(sent.status, 200);
  assert.deepEqual(sentPayload, {
    title: "GymBros Notification",
    body: "Time to train!",
    url: "/",
  });
});

test("removes expired subscriptions", async () => {
  const server = createTestServer(async () => {
    const error = Object.assign(new Error("expired"), { statusCode: 410 });
    throw error;
  });
  await server.store.save("user-3", subscription);
  const result = await request(server.server, "/api/notifications/send", {
    method: "POST",
    headers: { "x-user-id": "sender-1" },
    body: JSON.stringify({ targetUserId: "user-3", messageText: "Hello" }),
  });
  assert.equal(result.status, 410);
  assert.equal(await server.store.findByUserId("user-3"), null);
});

test("sends a test notification to the authenticated user", async () => {
  let sentPayload: Record<string, unknown> | undefined;
  const server = createTestServer(async (_subscription, payload) => {
    sentPayload = JSON.parse(payload) as Record<string, unknown>;
  });

  test("creates, lists, and marks an in-app notification as read", async () => {
    const server = createTestServer();
    const created = await request(server.server, "/api/notifications", {
      method: "POST",
      headers: { "x-user-id": "sender" },
      body: JSON.stringify({
        targetUserId: "recipient",
        title: "Friend request",
        message: "You have a new friend request.",
      }),
    });
    assert.equal(created.status, 201);
    const notification = created.body.notification as Record<string, unknown>;
    assert.equal(notification.read, false);

    const listed = await request(server.server, "/api/notifications/inbox", {
      method: "GET",
      headers: { "x-user-id": "recipient" },
    });
    assert.equal(listed.status, 200);
    const notifications = listed.body.notifications as Array<Record<string, unknown>>;
    assert.equal(notifications.length, 1);

    const marked = await request(
      server.server,
      `/api/notifications/inbox/${notification.id as string}/read`,
      { method: "PATCH", headers: { "x-user-id": "recipient" } },
    );
    assert.equal(marked.status, 204);
    const unread = await request(
      server.server,
      "/api/notifications/inbox?unreadOnly=true",
      { method: "GET", headers: { "x-user-id": "recipient" } },
    );
    assert.deepEqual(unread.body.notifications, []);
  });

  test("validates and stores an authenticated device token", async () => {
    const server = createTestServer();
    const saved = await request(server.server, "/api/notifications/device-token", {
      method: "POST",
      headers: { "x-user-id": "user-5" },
      body: JSON.stringify({ token: "fcm-token", platform: "android" }),
    });

    test("sends native notifications and removes invalid FCM tokens", async () => {
      let sentTokens: string[] = [];
      const server = createTestServer(
        undefined,
        {
          async send(tokens) {
            sentTokens = tokens;
            return ["expired-token"];
          },
        },
      );
      await request(server.server, "/api/notifications/device-token", {
        method: "POST",
        headers: { "x-user-id": "recipient" },
        body: JSON.stringify({ token: "expired-token", platform: "android" }),
      });
      await request(server.server, "/api/notifications/device-token", {
        method: "POST",
        headers: { "x-user-id": "recipient" },
        body: JSON.stringify({ token: "valid-token", platform: "android" }),
      });

      const result = await request(server.server, "/api/notifications", {
        method: "POST",
        headers: { "x-user-id": "sender" },
        body: JSON.stringify({
          targetUserId: "recipient",
          title: "Friend request",
          message: "You have a new friend request.",
        }),
      });

      assert.equal(result.status, 201);
      assert.deepEqual(sentTokens, ["expired-token", "valid-token"]);
      assert.deepEqual(server.deviceTokens, [
        { userId: "recipient", token: "valid-token", platform: "android" },
      ]);
    });
    assert.equal(saved.status, 204);
    assert.deepEqual(server.deviceTokens, [
      { userId: "user-5", token: "fcm-token", platform: "android" },
    ]);
  });
  await server.store.save("user-4", subscription);

  const result = await request(server.server, "/api/notifications/test", {
    method: "POST",
    headers: { "x-user-id": "user-4" },
    body: JSON.stringify({}),
  });

  assert.equal(result.status, 200);
  assert.deepEqual(sentPayload, {
    title: "GymBros Test",
    body: "Time to train!",
    url: "/",
  });
});
