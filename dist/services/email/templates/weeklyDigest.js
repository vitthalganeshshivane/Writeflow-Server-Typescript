"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyDigestTemplate = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const templatePath = path_1.default.resolve(process.cwd(), "services/email/templates/weeklyDigest.html");
const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
const replaceToken = (html, token, value) => html.replace(new RegExp(`{{${token}}}`, "g"), escapeHtml(value));
const weeklyDigestTemplate = (data) => {
    let html = fs_1.default.readFileSync(templatePath, "utf-8");
    for (const [key, value] of Object.entries(data)) {
        html = replaceToken(html, key, value);
    }
    return html;
};
exports.weeklyDigestTemplate = weeklyDigestTemplate;
