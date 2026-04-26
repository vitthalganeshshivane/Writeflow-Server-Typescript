import "dotenv/config";
import connectDB from "../config/db";
import { registerWeeklyDigestScheduler } from "../jobs/registerWeeklyDigestScheduler";
import "../workers/email.worker";

const start = async () => {
  await connectDB();
  await registerWeeklyDigestScheduler();

  console.log("Email worker running and weekly digest scheduler registered");
};

start().catch((error) => {
  console.error("Failed to start email worker:", error);
  process.exit(1);
});
