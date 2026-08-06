"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailQueue = createEmailQueue;
const bullmq_1 = require("bullmq");
function createEmailQueue(connection) {
    return new bullmq_1.Queue("email-queue", {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 3000 },
            removeOnComplete: true,
            removeOnFail: true,
        },
    });
}
