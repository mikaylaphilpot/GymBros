import cors from "cors";
import dotenv from "dotenv";
import express from "express";
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

function createUnavailableStore() {
  return {
    save: async () => {
      const error = new Error("MongoDB is not configured");
      error.statusCode = 503;
      throw error;
    },
    findByUserId: async () => null,
    deleteByUserId: async () => undefined,
  };
}

async function startServer() {
  let client: MongoClient | undefined;
  let store = createInMemoryPushSubscriptionStore();

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
  app.use((error: Error & { statusCode?: number }, _req, res, _next) => {
    const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    res.status(status).json({ message: error.message || "Internal server error" });
  });

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
