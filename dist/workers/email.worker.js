"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redis_1 = __importDefault(require("../config/redis"));
const digest_1 = require("../services/email/digest");
const worker = new bullmq_1.Worker("email-queue", async (job) => {
    if (job.name === "weekly-digest") {
        await (0, digest_1.sendWeeklyDigest)();
        return { sent: true };
    }
    return null;
}, {
    connection: redis_1.default,
    concurrency: 1,
});
worker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed`);
});
worker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed`, err);
});
