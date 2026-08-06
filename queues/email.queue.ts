import { Queue } from "bullmq";
import type IORedis from "ioredis";

export function createEmailQueue(connection: IORedis) {
  return new Queue("email-queue", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: true,
      removeOnFail: true,
    },
  });
}
