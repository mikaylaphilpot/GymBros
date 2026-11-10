import express, {
  type RequestHandler,
  type Response,
  type NextFunction,
} from "express";
import webpush from "web-push";
import authMiddleware from "../middleware/authMiddleware.js";
import type {
  PushSubscription,
  PushSubscriptionRecord,
  PushSubscriptionStore,
} from "../models/pushSubscription.js";

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

// AI-assisted: route factory keeps delivery dependencies injectable for tests
// while production requests always pass through JWT authentication.
export function createNotificationRouter({
  store,
  pushClient = webpush,
  allowDevTest = false,
  authenticationMiddleware = devOrJwtAuthentication(),
}: NotificationRouterOptions): express.Router {
  if (!store) {
    throw new TypeError("A push subscription store is required");
  }

  const router = express.Router();
  router.use(authenticationMiddleware);

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
