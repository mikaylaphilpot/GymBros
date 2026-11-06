import cors from "cors"
import express from "express"
import { connectToMongoDB } from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import scheduleRoutes from "./routes/scheduleRoutes.js"
import userRoutes from "./routes/userRoutes.js"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/api/test", (_req, res) => {
  res.json({ message: "Backend is working!" })
})

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/schedules", scheduleRoutes)

async function startServer(): Promise<void> {
  try {
    await connectToMongoDB()

    const port = Number(process.env.PORT ?? 5001)
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error: unknown) {
    console.error("Server error:", error)
    process.exit(1)
  }
}

void startServer()
