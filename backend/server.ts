import cors from "cors"
import express from "express"
import { connectToMongoDB } from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import scheduleRoutes from "./routes/scheduleRoutes.js"
import userRoutes from "./routes/userRoutes.js"

// Initialize Express application
const app = express()

// Enable CORS for frontend-backend communication
// Parse incoming JSON request bodies
app.use(cors())
app.use(express.json())

// GET /api/test
// Test endpoint to verify that the backend server is running
app.get("/api/test", (_req, res) => {
  res.json({ message: "Backend is working!" })
})

// Register authentication routes (signup, login, and protected user profile)
// All auth endpoints are prefixed with /api/auth
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/schedules", scheduleRoutes)

// Connect to MongoDB before starting the Express server
async function startServer(): Promise<void> {
  try {
    // Establish database connection using config/db.js
    await connectToMongoDB()

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
