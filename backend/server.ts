// backend/server.ts
import express from "express";
import { connectToMongoDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";


// AI-assisted: Initial Implementation suggested by Copilot
const app = express();

app.use(express.json());
app.use("/api/users", userRoutes);

app.listen(3001, async () => {
  await connectToMongoDB();
  console.log("Server running on http://localhost:3001");
});