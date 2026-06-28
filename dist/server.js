"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const blogRoutes_1 = __importDefault(require("./routes/blogRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const agentRoutes_1 = __importDefault(require("./routes/agentRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL],
    credentials: true,
}));
const PORT = process.env.PORT || 8000;
const startServer = async () => {
    try {
        await (0, db_1.default)();
        app.use("/api/auth", authRoutes_1.default);
        app.use("/api/blog", blogRoutes_1.default);
        app.use("/api/upload", uploadRoutes_1.default);
        app.use("/api/user", userRoutes_1.default);
        app.use("/api/notification", notificationRoutes_1.default);
        app.use("/api/agent", agentRoutes_1.default);
        app.get("/", (req, res) => {
            res.send("The server is running");
        });
        app.listen(PORT, () => {
            console.log(`✓ API server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
