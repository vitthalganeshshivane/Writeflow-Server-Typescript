"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = void 0;
const mailer_1 = require("./mailer");
const welcome_1 = require("./templates/welcome");
const sendWelcomeEmail = async (user) => {
    const html = (0, welcome_1.welcomeTemplate)(user.name);
    await (0, mailer_1.sendMail)({
        to: user.email,
        subject: "Welcome to Writeflow 🚀",
        html,
    });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
