"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAuth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let serviceAccount;
try {
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!base64) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 missing");
    }
    const json = Buffer.from(base64, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    serviceAccount = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    };
}
catch (err) {
    console.error("❌ Firebase credential load failed:", err.message);
    process.exit(1);
}
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
exports.firebaseAuth = firebase_admin_1.default.auth();
