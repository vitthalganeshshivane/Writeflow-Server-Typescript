import "dotenv/config";
import connectDB from "./config/db";
import { registerWeeklyDigestScheduler } from "./jobs/registerWeeklyDigestScheduler";
import "./workers/email.worker";

const startWorker = async () => {
  try {
    await connectDB();

    await registerWeeklyDigestScheduler();

    console.log("✓ Email worker running");
    console.log("✓ Weekly digest scheduler registered (every 7 days)");
  } catch (error) {
    console.error("Failed to start email worker:", error);
    process.exit(1);
  }
};

startWorker();
