import { Worker } from "bullmq";
import type IORedis from "ioredis";
import { sendWeeklyDigest } from "../services/email/digest";

export function createEmailWorker(connection: IORedis) {
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
      connection,
      concurrency: 1,
    },
  );

  worker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed`, err);
  });

  return worker;
}
