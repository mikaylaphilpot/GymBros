import cors from "cors";
import dotenv from "dotenv";
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { MongoClient } from "mongodb";
import { connectToMongoDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import {
  createInMemoryPushSubscriptionStore,
  createMongoPushSubscriptionStore,
} from "./models/pushSubscription.js";
import { createNotificationRouter } from "./routes/notificationRoutes.js";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      userId?: string;
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/test", (_req, res) => {
  res.json({ message: "Backend is working!" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRoutes);

if (process.env.ALLOW_DEV_USER_HEADER === "true") {
  app.use((req, _res, next) => {
    const userId = req.headers["x-user-id"];
    if (typeof userId === "string") {
      req.user = { id: userId };
    }
    next();
  });
}

type PushSubscriptionStore = ReturnType<
  typeof createInMemoryPushSubscriptionStore
>;

interface StatusError extends Error {
  statusCode?: number;
}

function createUnavailableStore(): PushSubscriptionStore {
  return {
    save: async (_userId, _subscription) => {
      const error = new Error("MongoDB is not configured");
      (error as StatusError).statusCode = 503;
      throw error;
    },
    findByUserId: async () => null,
    deleteByUserId: async () => ({ deletedCount: 0 }),
  };
}

async function startServer() {
  let client: MongoClient | undefined;
  let store: PushSubscriptionStore = createInMemoryPushSubscriptionStore();

  if (process.env.MONGODB_URI) {
    await connectToMongoDB();
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    store = createMongoPushSubscriptionStore(
      client.db(process.env.MONGODB_DB || "gymbros"),
    );
  } else if (process.env.NODE_ENV === "production") {
    store = createUnavailableStore();
  } else {
    console.warn("MONGODB_URI is not configured; using in-memory push subscriptions");
  }

  app.use("/api/notifications", createNotificationRouter({ store }));
  const errorHandler: ErrorRequestHandler = (
    error: StatusError,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const statusCode = error.statusCode;
    const status =
      statusCode !== undefined && Number.isInteger(statusCode)
        ? statusCode
        : 500;
    res.status(status).json({ message: error.message || "Internal server error" });
  };
  app.use(errorHandler);

  const port = Number(process.env.PORT) || 5001;
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on("close", async () => {
    await client?.close();
  });

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exitCode = 1;
  });
}

export { app, startServer };
