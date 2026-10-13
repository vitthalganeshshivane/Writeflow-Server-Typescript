"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = __importDefault(require("../config/db"));
const redis_1 = __importDefault(require("../config/redis"));
const email_queue_1 = require("../queues/email.queue");
const registerWeeklyDigestScheduler_1 = require("../jobs/registerWeeklyDigestScheduler");
const email_worker_1 = require("../workers/email.worker");
const start = async () => {
    const redisConnection = await redis_1.default;
    const emailQueue = (0, email_queue_1.createEmailQueue)(redisConnection);
    (0, email_worker_1.createEmailWorker)(redisConnection);
    await (0, db_1.default)();
    await (0, registerWeeklyDigestScheduler_1.registerWeeklyDigestScheduler)(emailQueue);
    console.log("Email worker running and weekly digest scheduler registered");
};
start().catch((error) => {
    console.error("Failed to start email worker:", error);
    process.exit(1);
});
