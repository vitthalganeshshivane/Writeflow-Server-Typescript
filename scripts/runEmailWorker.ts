import "dotenv/config";
import connectDB from "../config/db";
import redisConnectionPromise from "../config/redis";
import { createEmailQueue } from "../queues/email.queue";
import { registerWeeklyDigestScheduler } from "../jobs/registerWeeklyDigestScheduler";
import { createEmailWorker } from "../workers/email.worker";

const start = async () => {
  const redisConnection = await redisConnectionPromise;
  const emailQueue = createEmailQueue(redisConnection);
  createEmailWorker(redisConnection);

  await connectDB();
  await registerWeeklyDigestScheduler(emailQueue);

  console.log("Email worker running and weekly digest scheduler registered");
};

start().catch((error) => {
  console.error("Failed to start email worker:", error);
  process.exit(1);
});
