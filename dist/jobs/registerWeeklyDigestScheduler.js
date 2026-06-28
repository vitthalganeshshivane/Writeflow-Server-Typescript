"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWeeklyDigestScheduler = void 0;
const email_queue_1 = require("../queues/email.queue");
const registerWeeklyDigestScheduler = async () => {
    await email_queue_1.emailQueue.upsertJobScheduler("weekly-digest-scheduler", {
        every: 7 * 24 * 60 * 60 * 1000,
    }, {
        name: "weekly-digest",
        data: {},
        opts: {
            attempts: 3,
            backoff: { type: "exponential", delay: 3000 },
            removeOnComplete: true,
            removeOnFail: true,
        },
    });
};
exports.registerWeeklyDigestScheduler = registerWeeklyDigestScheduler;
