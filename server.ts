import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import { registerWeeklyDigestScheduler } from "./jobs/registerWeeklyDigestScheduler";

import authRoutes from "./routes/authRoutes";
import blogRoutes from "./routes/blogRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import userRoutes from "./routes/userRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import agentRoutes from "./routes/agentRoutes";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL as string],
    credentials: true,
  }),
);

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Initialize BullMQ worker and scheduler AFTER DB is connected
    // This runs both worker and scheduler in the same process
    await registerWeeklyDigestScheduler();

    // Import and start worker (side-effect initialization)
    // Worker starts listening automatically when imported
    await import("./workers/email.worker");

    console.log("✓ BullMQ worker and scheduler initialized");

    // Mount API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/blog", blogRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/notification", notificationRoutes);
    app.use("/api/agent", agentRoutes);

    app.get("/", (req, res) => {
      res.send("The server is running");
    });

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Email worker running in same process`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
