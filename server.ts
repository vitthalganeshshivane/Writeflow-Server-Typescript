console.log("[BOOT-1] Process started");

require("dotenv/config");
console.log("[BOOT-2] Env loaded");

const express = require("express");
const cors = require("cors");
console.log("[BOOT-3] Express and CORS loaded");

(async () => {
  try {
    console.log("[BOOT-4] Resolving Redis connection...");
    const connectionPromise = require("./config/redis").default;
    const redisConnection = await connectionPromise;
    console.log("[BOOT-5] Redis connection ready");

    let emailQueue: any = null;
    try {
      console.log("[BOOT-6] Creating BullMQ queue...");
      const { createEmailQueue } = require("./queues/email.queue");
      emailQueue = createEmailQueue(redisConnection);
      console.log("[BOOT-7] Queue created");

      console.log("[BOOT-8] Registering weekly digest scheduler...");
      const { registerWeeklyDigestScheduler } = require("./jobs/registerWeeklyDigestScheduler");
      await registerWeeklyDigestScheduler(emailQueue);
      console.log("[BOOT-9] Scheduler registered");
    } catch (schedulerErr: any) {
      console.error("[BOOT-6-WARN] BullMQ scheduler failed (non-fatal):");
      console.error("error.name:", schedulerErr.name);
      console.error("error.message:", schedulerErr.message);
      console.error("Server will continue without email scheduler.");
    }

    try {
      console.log("[BOOT-10] Creating email worker...");
      const { createEmailWorker } = require("./workers/email.worker");
      createEmailWorker(redisConnection);
      console.log("[BOOT-11] Worker created");
    } catch (workerErr: any) {
      console.error("[BOOT-10-WARN] BullMQ worker failed (non-fatal):");
      console.error("error.name:", workerErr.name);
      console.error("error.message:", workerErr.message);
      console.error("Server will continue without email worker.");
    }

    console.log("[BOOT-12] Importing routes...");
    const authRoutes = require("./routes/authRoutes").default;
    console.log("[BOOT-13] authRoutes imported");
    const blogRoutes = require("./routes/blogRoutes").default;
    console.log("[BOOT-14] blogRoutes imported");
    const uploadRoutes = require("./routes/uploadRoutes").default;
    console.log("[BOOT-15] uploadRoutes imported");
    const userRoutes = require("./routes/userRoutes").default;
    console.log("[BOOT-16] userRoutes imported");
    const notificationRoutes = require("./routes/notificationRoutes").default;
    console.log("[BOOT-17] notificationRoutes imported");
    const agentRoutes = require("./routes/agentRoutes").default;
    console.log("[BOOT-18] agentRoutes imported");
    console.log("[BOOT-19] All routes imported");

    console.log("[BOOT-20] Connecting to MongoDB...");
    const connectDB = require("./config/db").default;
    await connectDB();
    console.log("[BOOT-21] MongoDB connected");

    const app = express();
    app.use(express.json());
    app.use(
      cors({
        origin: ["http://localhost:5173", process.env.FRONTEND_URL],
        credentials: true,
      }),
    );
    console.log("[BOOT-22] Express middleware configured");

    // Lightweight health check - no DB/Redis, used for Render keep-alive and monitoring
    app.get("/health", (_req: any, res: any) => {
      res.set("Cache-Control", "no-store");
      res.status(200).json({ status: "ok", timestamp: new Date().toISOString(), uptime: process.uptime() });
    });
    app.head("/health", (_req: any, res: any) => {
      res.set("Cache-Control", "no-store");
      res.status(200).end();
    });

    console.log("[BOOT-23] Mounting routes...");
    app.use("/api/auth", authRoutes);
    app.use("/api/blog", blogRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/notification", notificationRoutes);
    app.use("/api/agent", agentRoutes);

    app.get("/", (_req: any, res: any) => {
      res.send("The server is running");
    });
    console.log("[BOOT-24] Routes mounted");

    const PORT = process.env.PORT || 8000;
    console.log("[BOOT-25] Starting Express on port", PORT);
    app.listen(PORT, () => {
      console.log("[BOOT-26] Server listening on port", PORT);
      // Start self-ping to prevent Render free tier sleep (14m interval)
      // Requires RENDER_EXTERNAL_URL (auto-injected by Render) or KEEP_ALIVE_URL
      try {
        const { startSelfPing } = require("./utils/keepAlive");
        startSelfPing();
      } catch (e: any) {
        console.error("[keep-alive] failed to start", e.message);
      }
    });
  } catch (error: any) {
    console.error("[BOOT-ERROR] Server startup failed");
    console.error("error.name:", error.name);
    console.error("error.message:", error.message);
    console.error("error.stack:", error.stack);
    process.exit(1);
  }
})();
