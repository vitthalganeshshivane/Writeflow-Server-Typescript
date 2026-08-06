"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.titleAgent = void 0;
const titleClient_1 = require("../services/ai/titleClient");
const validProviders = new Set(["groq", "gemini", "nvidia"]);
const validModes = new Set(["slash", "ghost", "suggest"]);
const titleAgent = async (req, res) => {
    try {
        const { provider, model, mode, input = "", description = "", tags = [], } = req.body;
        // 🔐 Auth checks
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!req.admin) {
            return res.status(403).json({
                error: "You don't have permission to use the AI title agent",
            });
        }
        // 🧠 Provider validation
        if (!validProviders.has(provider)) {
            return res.status(400).json({
                error: "provider must be groq, gemini, or nvidia",
            });
        }
        // 🧠 Model validation (simple)
        if (typeof model !== "string" || !model.length) {
            return res.status(400).json({
                error: "model is required",
            });
        }
        // 🧠 Mode validation
        if (!validModes.has(mode)) {
            return res.status(400).json({
                error: "mode must be slash, ghost, or suggest",
            });
        }
        // 🧠 Input validation
        if (!String(input).trim()) {
            return res.status(400).json({
                error: "input is required",
            });
        }
        // 🚀 Call AI
        const result = await (0, titleClient_1.generateTitles)({
            provider,
            model,
            mode,
            input: String(input).trim(),
            description,
            tags,
        });
        return res.status(200).json({
            ...result,
            provider,
            model,
            mode,
        });
    }
    catch (err) {
        return res.status(500).json({
            error: err?.message || "AI title request failed",
        });
    }
};
exports.titleAgent = titleAgent;
