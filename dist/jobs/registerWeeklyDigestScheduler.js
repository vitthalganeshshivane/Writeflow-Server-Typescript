"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWeeklyDigestScheduler = void 0;
const registerWeeklyDigestScheduler = async (queue) => {
    await queue.upsertJobScheduler("weekly-digest-scheduler", {
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
