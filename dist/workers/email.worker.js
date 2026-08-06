"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailWorker = createEmailWorker;
const bullmq_1 = require("bullmq");
const digest_1 = require("../services/email/digest");
function createEmailWorker(connection) {
    const worker = new bullmq_1.Worker("email-queue", async (job) => {
        if (job.name === "weekly-digest") {
            await (0, digest_1.sendWeeklyDigest)();
            return { sent: true };
        }
        return null;
    }, {
        connection,
        concurrency: 1,
    });
    worker.on("completed", (job) => {
        console.log(`Email job ${job.id} completed`);
    });
    worker.on("failed", (job, err) => {
        console.error(`Email job ${job?.id} failed`, err);
    });
    return worker;
}
