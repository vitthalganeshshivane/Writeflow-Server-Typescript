import { Worker } from "bullmq";
import redisConnection from "../config/redis";
import { sendWeeklyDigest } from "../services/email/digest";

const worker = new Worker(
  "email-queue",
  async (job) => {
    if (job.name === "weekly-digest") {
      await sendWeeklyDigest();
      return { sent: true };
    }

    return null;
  },
  {
    connection: redisConnection,
    concurrency: 1,
  },
);

worker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed`, err);
});
