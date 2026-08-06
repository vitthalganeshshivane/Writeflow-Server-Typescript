"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = exports.allNotificationsCount = exports.newNotification = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const newNotification = async (req, res) => {
    try {
        const user_id = req.user;
        const result = await Notification_1.default.exists({
            notification_for: user_id,
            seen: false,
            user: { $ne: user_id },
        });
        return res.status(200).json({
            new_notification_available: Boolean(result),
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.newNotification = newNotification;
const allNotificationsCount = async (req, res) => {
    try {
        const user_id = req.user;
        const { filter = "all" } = req.body;
        let findQuery = {
            notification_for: user_id,
            user: { $ne: user_id },
        };
        if (filter !== "all") {
            findQuery.type = filter;
        }
        const count = await Notification_1.default.countDocuments(findQuery);
        return res.status(200).json({ totalDocs: count });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.allNotificationsCount = allNotificationsCount;
const getNotifications = async (req, res) => {
    try {
        const user_id = req.user;
        const { page = 1, filter = "all", deletedDocCount = 0 } = req.body;
        const maxLimit = 10;
        let findQuery = {
            notification_for: user_id,
            user: { $ne: user_id },
        };
        if (filter !== "all") {
            findQuery.type = filter;
        }
        let skipDocs = (page - 1) * maxLimit;
        if (deletedDocCount) {
            skipDocs -= deletedDocCount;
        }
        const notifications = await Notification_1.default.find(findQuery)
            .skip(skipDocs)
            .limit(maxLimit)
            .populate("blog", "title blog_id")
            .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
            .populate("comment", "comment")
            .populate("replied_on_comment", "comment")
            .populate("reply", "comment")
            .sort({ createdAt: -1 })
            .select("createdAt type seen reply");
        // 🔥 mark as seen
        await Notification_1.default.updateMany(findQuery, { seen: true })
            .skip(skipDocs)
            .limit(maxLimit);
        return res.status(200).json({ notifications });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getNotifications = getNotifications;
