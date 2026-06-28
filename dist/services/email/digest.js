"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWeeklyDigest = void 0;
const User_1 = __importDefault(require("../../models/User"));
const Blog_1 = __importDefault(require("../../models/Blog"));
const mailer_1 = require("./mailer");
const weeklyDigest_1 = require("./templates/weeklyDigest");
const FRONTEND_URL = process.env.FRONTEND_URL || "https://writeflow-blogs.vercel.app";
const formatDate = (value) => {
    if (!value)
        return "";
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};
const buildWeekDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const format = (date) => date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    return `${format(start)} - ${format(end)}`;
};
const buildArticle = (blog, index) => ({
    [`article${index}_author`]: blog?.author?.personal_info?.fullname || "WriteFlow",
    [`article${index}_date`]: formatDate(blog?.publishedAt),
    [`article${index}_url`]: blog?.blog_id
        ? `${FRONTEND_URL}/blog/${blog.blog_id}`
        : FRONTEND_URL,
    [`article${index}_title`]: blog?.title || "More stories coming soon",
    [`article${index}_excerpt`]: blog?.des?.slice(0, 160) || "Fresh stories will appear here soon.",
    [`article${index}_tag`]: blog?.tags?.[0] || "Story",
});
const buildFallbackBlog = {
    blog_id: "",
    title: "More stories coming soon",
    des: "Fresh community stories will appear here soon.",
    tags: ["Story"],
    publishedAt: new Date(),
    author: {
        personal_info: {
            fullname: "WriteFlow",
            username: "writeflow",
            bio: "A place for writers to share ideas.",
            profile_img: "",
        },
    },
};
const sendWeeklyDigest = async () => {
    const blogs = (await Blog_1.default.find({ draft: false })
        .sort({
        "activity.total_likes": -1,
        "activity.total_reads": -1,
        publishedAt: -1,
    })
        .limit(5)
        .populate("author", "personal_info.fullname personal_info.username personal_info.bio personal_info.profile_img")
        .select("title des blog_id tags publishedAt author")
        .lean());
    const users = (await User_1.default.find({}, { "personal_info.fullname": 1, "personal_info.email": 1 }).lean());
    const featuredBlog = blogs[0] ?? buildFallbackBlog;
    const topFive = [...blogs.slice(0, 5)];
    while (topFive.length < 5) {
        topFive.push(null);
    }
    const templateData = {
        app_url: FRONTEND_URL,
        week_date_range: buildWeekDateRange(),
        featured_author: featuredBlog.author?.personal_info?.fullname || "WriteFlow",
        featured_handle: featuredBlog.author?.personal_info?.username || "writeflow",
        featured_date: formatDate(featuredBlog.publishedAt),
        featured_url: featuredBlog.blog_id
            ? `${FRONTEND_URL}/blog/${featuredBlog.blog_id}`
            : FRONTEND_URL,
        featured_title: featuredBlog.title || "More stories coming soon",
        featured_excerpt: featuredBlog.des?.slice(0, 160) || "Fresh stories will appear here soon.",
        ...buildArticle(topFive[0], 1),
        ...buildArticle(topFive[1], 2),
        ...buildArticle(topFive[2], 3),
        ...buildArticle(topFive[3], 4),
        ...buildArticle(topFive[4], 5),
        spotlight_emoji: "✍️",
        spotlight_name: featuredBlog.author?.personal_info?.fullname || "WriteFlow",
        spotlight_handle: featuredBlog.author?.personal_info?.username || "writeflow",
        spotlight_bio: featuredBlog.author?.personal_info?.bio ||
            "A creator building thoughtful stories on WriteFlow.",
        spotlight_url: featuredBlog.author?.personal_info?.username
            ? `${FRONTEND_URL}/user/${featuredBlog.author.personal_info.username}`
            : FRONTEND_URL,
    };
    const html = (0, weeklyDigest_1.weeklyDigestTemplate)(templateData);
    const chunkSize = 25;
    for (let i = 0; i < users.length; i += chunkSize) {
        const batch = users.slice(i, i + chunkSize);
        await Promise.allSettled(batch.map((user) => {
            const email = user.personal_info?.email;
            if (!email) {
                return Promise.resolve();
            }
            return (0, mailer_1.sendMail)({
                to: email,
                subject: "Your weekly WriteFlow digest",
                html,
            });
        }));
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
};
exports.sendWeeklyDigest = sendWeeklyDigest;
