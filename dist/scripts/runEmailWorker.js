"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = __importDefault(require("../config/db"));
const registerWeeklyDigestScheduler_1 = require("../jobs/registerWeeklyDigestScheduler");
require("../workers/email.worker");
const start = async () => {
    await (0, db_1.default)();
    await (0, registerWeeklyDigestScheduler_1.registerWeeklyDigestScheduler)();
    console.log("Email worker running and weekly digest scheduler registered");
};
start().catch((error) => {
    console.error("Failed to start email worker:", error);
    process.exit(1);
});
