"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.welcomeTemplate = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const templatePath = path_1.default.join(__dirname, "welcome.html");
const welcomeTemplate = (username, appUrl = "https://writeflow-blogs.vercel.app") => {
    let html = fs_1.default.readFileSync(templatePath, "utf-8");
    html = html.replace(/{{username}}/g, username);
    html = html.replace(/{{app_url}}/g, appUrl);
    return html;
};
exports.welcomeTemplate = welcomeTemplate;
