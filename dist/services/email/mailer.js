"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendMail = async ({ to, subject, html, }) => {
    await exports.transporter.sendMail({
        from: `"Writeflow" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};
exports.sendMail = sendMail;
