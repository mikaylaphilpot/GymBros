import cors from "cors"
import express from "express"
import mongoose from "mongoose"
import webpush from "web-push"
import { connectToMongoDB } from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import { createMongoPushSubscriptionStore } from "./models/pushSubscription.js"
import { createNotificationRouter } from "./routes/notificationRoutes.js"
import { createNotificationStore } from "./models/notification.js"
import { createDeviceTokenStore } from "./models/deviceToken.js"
import { createFirebasePushSender } from "./services/firebaseNotifications.js"
import scheduleRoutes from "./routes/scheduleRoutes.js"
import userRoutes from "./routes/userRoutes.js"

// Initialize Express application
const app = express()

// Allow browser clients, including SwaggerHub's Try it out interface, to call
// the API while keeping credentialed requests off the wildcard origin.
const allowedCorsOrigins = new Set([
  "https://app.swaggerhub.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://cop4431-jonathonf.online",
])

// Enable CORS for frontend-backend communication
// Parse incoming JSON request bodies
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      callback(null, !origin || allowedCorsOrigins.has(origin))
    },
  }),
)
app.use(express.json())

// GET /api/test
// Test endpoint to verify that the backend server is running
app.get("/api/test", (_req, res) => {
  res.json({ message: "Backend is working!" })
})

// Register authentication, user, and schedule routes.
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/schedules", scheduleRoutes)

function configurePushNotifications(): void {
  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "VAPID_SUBJECT, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY must be set in backend/.env.",
    )
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
}

// Connect to MongoDB before starting the Express server
async function startServer(): Promise<void> {
  try {
    // Establish database connection using config/db.ts
    await connectToMongoDB()
    configurePushNotifications()

    const database = mongoose.connection.db
    if (!database) {
      throw new Error("MongoDB connection did not expose a database handle.")
    }
    app.use(
      "/api/notifications",
      createNotificationRouter({
        store: createMongoPushSubscriptionStore(database),
        notificationStore: createNotificationStore(database.collection("notifications")),
        deviceTokenStore: createDeviceTokenStore(database.collection("deviceTokens")),
        nativePushSender: createFirebasePushSender(),
        allowDevTest: process.env.NODE_ENV !== "production",
      }),
    )

    // Start listening for incoming requests on port 5001
    const port = Number(process.env.PORT ?? 5001)
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error: unknown) {
    // Log startup errors and exit if the database connection fails
    console.error("Server error:", error)
    process.exit(1)
  }
}

// Initialize the database connection and start the server
void startServer()
