import express, {
  type RequestHandler,
  type Response,
  type NextFunction,
} from "express";
import mongoose from "mongoose";
import webpush from "web-push";
import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import type {
  PushSubscription,
  PushSubscriptionRecord,
  PushSubscriptionStore,
} from "../models/pushSubscription.js";
import type { DeviceTokenStore } from "../models/deviceToken.js";
import type { NotificationRecord, NotificationStore } from "../models/notification.js";
import type { NativePushSender } from "../services/firebaseNotifications.js";

interface NotificationBody {
  targetUserId?: unknown;
  messageText?: unknown;
  title?: unknown;
  url?: unknown;
  subscription?: unknown;
}

interface PushClient {
  sendNotification(
    subscription: PushSubscription,
    payload: string,
  ): Promise<unknown>;
}

interface NotificationRouterOptions {
  store: PushSubscriptionStore;
  pushClient?: PushClient;
  allowDevTest?: boolean;
  authenticationMiddleware?: RequestHandler;
  notificationStore?: NotificationStore;
  deviceTokenStore?: DeviceTokenStore;
  nativePushSender?: NativePushSender;
}

interface PushError {
  statusCode?: number;
}

function isPushError(error: unknown): error is PushError {
  return typeof error === "object" && error !== null && "statusCode" in error;
}

function devOrJwtAuthentication(): RequestHandler {
  return (req, res, next) => {
    const header = req.headers["x-user-id"];
    if (
      process.env.ALLOW_DEV_USER_HEADER === "true" &&
      typeof header === "string" &&
      header.trim()
    ) {
      req.userId = header.trim();
      next();
      return;
    }

    authMiddleware(req, res, next);
  };
}

function createPayload({
  messageText,
  title,
  url,
}: {
  messageText: string;
  title: unknown;
  url: unknown;
}): string {
  return JSON.stringify({
    title:
      typeof title === "string" && title.trim()
        ? title.trim()
        : "GymBros Notification",
    body: messageText.trim(),
    url: typeof url === "string" && url.trim() ? url.trim() : "/",
  });
}

async function sendToRecord(
  record: PushSubscriptionRecord,
  pushClient: PushClient,
  payload: string,
): Promise<void> {
  await pushClient.sendNotification(record.subscription, payload);
}

// AI-assisted: keeps friend actions consistent across browser, in-app, and native delivery.
async function sendToAllChannels(
  targetUserId: string,
  notification: { title: string; message: string; url?: string },
  dependencies: {
    notificationStore: NotificationStore;
    store: PushSubscriptionStore;
    deviceTokenStore?: DeviceTokenStore;
    nativePushSender?: NativePushSender;
  },
): Promise<NotificationRecord> {
  const created = await dependencies.notificationStore.create({
    userId: targetUserId,
    ...notification,
  });

  const browserRecord = await dependencies.store.findByUserId(targetUserId);
  if (browserRecord) {
    try {
      await sendToRecord(
        browserRecord,
        webpush,
        createPayload({
          messageText: notification.message,
          title: notification.title,
          url: notification.url,
        }),
      );
    } catch (error) {
      if (isPushError(error) && (error.statusCode === 404 || error.statusCode === 410)) {
        await dependencies.store.deleteByUserId(targetUserId);
      } else {
        throw error;
      }
    }
  }

  if (dependencies.nativePushSender && dependencies.deviceTokenStore) {
    try {
      const tokens = await dependencies.deviceTokenStore.list(targetUserId);
      const invalidTokens = await dependencies.nativePushSender.send(tokens, notification);
      await Promise.all(
        invalidTokens.map((token) => dependencies.deviceTokenStore?.delete(targetUserId, token)),
      );
    } catch (error) {
      console.error("Native push delivery failed:", error);
    }
  }

  return created;
}

// AI-assisted: route factory keeps delivery dependencies injectable for tests
// while production requests always pass through JWT authentication.
export function createNotificationRouter({
  store,
  pushClient = webpush,
  allowDevTest = false,
  authenticationMiddleware = devOrJwtAuthentication(),
  notificationStore,
  deviceTokenStore,
  nativePushSender,
}: NotificationRouterOptions): express.Router {
  if (!store) {
    throw new TypeError("A push subscription store is required");
  }

  const router = express.Router();
  router.use(authenticationMiddleware);


  router.get("/inbox", async (req, res, next) => {
    if (!req.userId) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }
    if (!notificationStore) {
      res.status(503).json({ message: "In-app notifications are not configured" });
      return;
    }
    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const requestedLimit = Number(req.query.limit ?? 50);
      const limit = Number.isInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 100)
        : 50;
      const notifications = await notificationStore.list(req.userId, unreadOnly, limit);
      res.json({ notifications });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/inbox/:notificationId/read", async (req, res, next) => {
    if (!req.userId) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }
    if (!notificationStore) {
      res.status(503).json({ message: "In-app notifications are not configured" });
      return;
    }
    try {
      const updated = await notificationStore.markRead(
        req.userId,
        req.params.notificationId,
      );
      res.status(updated ? 204 : 404).send();
    } catch (error) {
      next(error);
    }
  });

  router.post("/device-token", async (req, res, next) => {
    if (!req.userId) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }
    if (!deviceTokenStore) {
      res.status(503).json({ message: "Device notifications are not configured" });
      return;
    }
    try {
      await deviceTokenStore.save(req.userId, req.body?.token, req.body?.platform);
      res.status(204).send();
    } catch (error) {
      if (error instanceof TypeError) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  });

  router.delete("/device-token", async (req, res, next) => {
    if (!req.userId) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }
    if (!deviceTokenStore) {
      res.status(503).json({ message: "Device notifications are not configured" });
      return;
    }
    try {
      await deviceTokenStore.delete(req.userId, req.body?.token);
      res.status(204).send();
    } catch (error) {
      if (error instanceof TypeError) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  });

  async function sendFriendNotification(
    req: express.Request<{ friendId: string }>,
    res: express.Response,
    next: express.NextFunction,
    kind: "bug" | "congratulate",
  ): Promise<void> {
    if (!req.userId) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }
    if (!notificationStore) {
      res.status(503).json({ message: "In-app notifications are not configured" });
      return;
    }
    if (!mongoose.isValidObjectId(req.params.friendId) || req.params.friendId === req.userId) {
      res.status(400).json({ message: "Invalid friend ID." });
      return;
    }

    try {
      const friend = await User.findById(req.params.friendId).select("_id username");
      const currentUser = await User.exists({
        _id: req.userId,
        "friends.friendId": req.params.friendId,
      });

      if (!friend || !currentUser) {
        res.status(404).json({ message: "Friend relationship not found." });
        return;
      }

      if (kind === "bug") {
        await User.updateOne(
          { _id: req.userId, "friends.friendId": req.params.friendId },
          {
            $inc: { "friends.$.bugCount": 1 },
            $set: { "friends.$.lastBuggedAt": new Date() },
          },
        );
      }

      const notification = await sendToAllChannels(
        req.params.friendId,
        {
          title: kind === "bug" ? "Your bro is checking in!" : "Congratulations, bro!",
          message: kind === "bug"
            ? `${req.userId} sent you a workout reminder.`
            : `${req.userId} congratulated you on your workout!`,
          url: "/home-page",
        },
        {
          notificationStore,
          store,
          deviceTokenStore,
          nativePushSender,
        },
      );

      res.status(201).json({ notification });
    } catch (error) {
      next(error);
    }
  }

  router.post("/", async (req, res, next) => {
    if (!req.userId) {
      res.status(401).json({ message: "Authentication is required" });
      return;
    }
    if (!notificationStore) {
      res.status(503).json({ message: "In-app notifications are not configured" });
      return;
    }
    const { targetUserId, title, message, url } = req.body ?? {};
    if (typeof targetUserId !== "string" || !targetUserId.trim()) {
      res.status(400).json({ message: "targetUserId is required" });
      return;
    }
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ message: "title is required" });
      return;
    }
    if (typeof message !== "string" || !message.trim()) {
      res.status(400).json({ message: "message is required" });
      return;
    }
    try {
      const notification = await notificationStore.create({
        userId: targetUserId.trim(),
        title: title.trim(),
        message: message.trim(),
        url: typeof url === "string" && url.trim() ? url.trim() : undefined,
      });

      if (nativePushSender && deviceTokenStore) {
        const tokens = await deviceTokenStore.list(targetUserId.trim());
        const invalidTokens = await nativePushSender.send(tokens, {
          title: title.trim(),
          message: message.trim(),
          url: typeof url === "string" && url.trim() ? url.trim() : undefined,
        });
        await Promise.all(
          invalidTokens.map((token) => deviceTokenStore.delete(targetUserId.trim(), token)),
        );
      }
      res.status(201).json({ notification });
    } catch (error) {
      next(error);
    }
  });

  router.post("/friends/:friendId/bug", (req, res, next) => {
    void sendFriendNotification(req, res, next, "bug");
  });

  router.post("/friends/:friendId/congratulate", (req, res, next) => {
    void sendFriendNotification(req, res, next, "congratulate");
  });

  router.post(
    "/subscribe",
    async (
      req: express.Request<unknown, unknown, NotificationBody>,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        if (!req.userId) {
          res.status(401).json({ message: "Authentication is required" });
          return;
        }

        await store.save(req.userId, req.body?.subscription);
        res.status(201).json({ message: "Subscription saved successfully" });
      } catch (error) {
        if (error instanceof TypeError) {
          res.status(400).json({ message: error.message });
          return;
        }
        next(error);
      }
    },
  );

  router.post(
    "/send",
    async (
      req: express.Request<unknown, unknown, NotificationBody>,
      res: Response,
      next: NextFunction,
    ) => {
      const { targetUserId, messageText, title, url } = req.body ?? {};
      if (!req.userId) {
        res.status(401).json({ message: "Authentication is required" });
        return;
      }
      if (typeof targetUserId !== "string" || !targetUserId.trim()) {
        res.status(400).json({ message: "targetUserId is required" });
        return;
      }
      if (typeof messageText !== "string" || !messageText.trim()) {
        res.status(400).json({ message: "messageText is required" });
        return;
      }

      try {
        const normalizedTargetId = targetUserId.trim();
        const record = await store.findByUserId(normalizedTargetId);
        if (!record) {
          res
            .status(404)
            .json({ message: "User is not subscribed to notifications" });
          return;
        }

        await sendToRecord(
          record,
          pushClient,
          createPayload({ messageText, title, url }),
        );
        res.status(200).json({ message: "Notification sent successfully" });
      } catch (error) {
        if (isPushError(error) && (error.statusCode === 404 || error.statusCode === 410)) {
          await store.deleteByUserId(targetUserId.trim());
          res
            .status(410)
            .json({ message: "The target notification subscription is no longer valid" });
          return;
        }
        next(error);
      }
    },
  );

  if (allowDevTest) {
    router.post(
      "/test",
      async (
        req: express.Request<unknown, unknown, NotificationBody>,
        res: Response,
        next: NextFunction,
      ) => {
        if (!req.userId) {
          res.status(401).json({ message: "Authentication is required" });
          return;
        }

        const messageText =
          typeof req.body?.messageText === "string" && req.body.messageText.trim()
            ? req.body.messageText
            : "Time to train!";

        try {
          const record = await store.findByUserId(req.userId);
          if (!record) {
            res
              .status(404)
              .json({ message: "Your browser is not subscribed to notifications" });
            return;
          }

          await sendToRecord(
            record,
            pushClient,
            createPayload({
              messageText,
              title: req.body?.title || "GymBros Test",
              url: req.body?.url || "/",
            }),
          );
          res.status(200).json({ message: "Test notification sent successfully" });
        } catch (error) {
          if (isPushError(error) && (error.statusCode === 404 || error.statusCode === 410)) {
            await store.deleteByUserId(req.userId);
            res
              .status(410)
              .json({ message: "Your notification subscription is no longer valid" });
            return;
          }
          next(error);
        }
      },
    );
  }

  return router;
}
