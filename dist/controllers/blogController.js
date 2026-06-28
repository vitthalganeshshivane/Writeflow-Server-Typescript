"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userWrittenBlogsCount = exports.userWrittenBlogs = exports.deleteComment = exports.getReplies = exports.getBlogComments = exports.addComment = exports.isLikedByUser = exports.likeBlog = exports.searchBlogsCount = exports.allLatestBlogsCount = exports.searchBlogs = exports.trendingBlogs = exports.latestBlogs = exports.getBlog = exports.createBlog = void 0;
const nanoid_1 = require("nanoid");
const Blog_1 = __importDefault(require("../models/Blog"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const Comment_1 = __importDefault(require("../models/Comment"));
const createBlog = async (req, res) => {
    try {
        const authorId = req.user;
        const admin = req.admin;
        if (!admin) {
            return res
                .status(403)
                .json({ error: "You don't have permission to create a blog" });
        }
        const { title, des, banner, tags, content, draft, id } = req.body;
        if (!title || !title.length) {
            return res.status(403).json({ error: "Title is required" });
        }
        if (!draft) {
            if (!des || des.length > 200) {
                return res.status(403).json({
                    error: "Description must be under 200 characters",
                });
            }
            if (!banner) {
                return res.status(403).json({ error: "Banner is required" });
            }
            if (!content?.blocks?.length) {
                return res.status(403).json({
                    error: "Content cannot be empty",
                });
            }
            if (!tags || tags.length > 10) {
                return res.status(403).json({
                    error: "Max 10 tags allowed",
                });
            }
        }
        const normalizedTags = tags.map((tag) => tag.toLowerCase());
        const blog_id = id ||
            title
                .replace(/[^a-zA-Z0-9]/g, " ")
                .replace(/\s+/g, "-")
                .trim() + (0, nanoid_1.nanoid)();
        if (id) {
            await Blog_1.default.findOneAndUpdate({ blog_id }, {
                title,
                des,
                banner,
                content,
                tags: normalizedTags,
                draft: Boolean(draft),
            });
            return res.status(200).json({ id: blog_id });
        }
        const blog = new Blog_1.default({
            title,
            des,
            banner,
            content,
            tags: normalizedTags,
            author: authorId,
            blog_id,
            draft: Boolean(draft),
        });
        const savedBlog = await blog.save();
        const incrementVal = draft ? 0 : 1;
        await User_1.default.findOneAndUpdate({ _id: authorId }, {
            $inc: { "account_info.total_posts": incrementVal },
            $push: { blogs: savedBlog._id },
        });
        return res.status(200).json({ id: savedBlog.blog_id });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.createBlog = createBlog;
const getBlog = async (req, res) => {
    try {
        const { blog_id, draft = false, mode } = req.body;
        if (!blog_id) {
            return res.status(400).json({ error: "Blog ID is required" });
        }
        const incrementVal = mode !== "edit" ? 1 : 0;
        const blog = await Blog_1.default.findOneAndUpdate({ blog_id }, { $inc: { "activity.total_reads": incrementVal } }, { new: true })
            .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
            .select("title des content banner activity publishedAt blog_id tags draft author");
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        if (blog.draft && !draft) {
            return res.status(403).json({ error: "You cannot access draft blog" });
        }
        if (incrementVal === 1) {
            await User_1.default.findOneAndUpdate({
                "personal_info.username": blog.author.personal_info.username,
            }, { $inc: { "account_info.total_reads": 1 } });
        }
        return res.status(200).json({ blog });
    }
    catch (err) {
        console.error("Get Blog Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getBlog = getBlog;
const latestBlogs = async (req, res) => {
    try {
        const { page = 1 } = req.body;
        const maxLimit = 5;
        const blogs = await Blog_1.default.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ publishedAt: -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .skip((page - 1) * maxLimit)
            .limit(maxLimit);
        return res.status(200).json({ blogs });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.latestBlogs = latestBlogs;
const trendingBlogs = async (req, res) => {
    try {
        const blogs = await Blog_1.default.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({
            "activity.total_read": -1,
            "activity.total_likes": -1,
            publishedAt: -1,
        })
            .select("blog_id title publishedAt -_id")
            .limit(5);
        return res.status(200).json({ blogs });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.trendingBlogs = trendingBlogs;
const searchBlogs = async (req, res) => {
    try {
        const { tag, query, author, page = 1, limit = 2, eliminate_blog, } = req.body;
        let findQuery;
        if (tag) {
            findQuery = {
                tags: tag,
                draft: false,
                blog_id: { $ne: eliminate_blog },
            };
        }
        else if (query) {
            findQuery = {
                draft: false,
                title: new RegExp(query, "i"),
            };
        }
        else if (author) {
            findQuery = {
                author,
                draft: false,
            };
        }
        else {
            findQuery = { draft: false };
        }
        const blogs = await Blog_1.default.find(findQuery)
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ publishedAt: -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .skip((page - 1) * limit)
            .limit(limit);
        return res.status(200).json({ blogs });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.searchBlogs = searchBlogs;
const allLatestBlogsCount = async (req, res) => {
    try {
        const count = await Blog_1.default.countDocuments({ draft: false });
        return res.status(200).json({ totalDocs: count });
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
    }
};
exports.allLatestBlogsCount = allLatestBlogsCount;
const searchBlogsCount = async (req, res) => {
    try {
        const { tag, author, query } = req.body;
        let findQuery;
        if (tag) {
            findQuery = { tags: tag, draft: false };
        }
        else if (query) {
            findQuery = { draft: false, title: new RegExp(query, "i") };
        }
        else if (author) {
            findQuery = { author, draft: false };
        }
        else {
            findQuery = { draft: false };
        }
        const count = await Blog_1.default.countDocuments(findQuery);
        return res.status(200).json({ totalDocs: count });
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
    }
};
exports.searchBlogsCount = searchBlogsCount;
const likeBlog = async (req, res) => {
    try {
        const user_id = req.user;
        const { _id, isLikedByUser } = req.body;
        const incrementVal = !isLikedByUser ? 1 : -1;
        const blog = await Blog_1.default.findByIdAndUpdate(_id, { $inc: { "activity.total_likes": incrementVal } }, { new: true });
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        if (!isLikedByUser) {
            const like = new Notification_1.default({
                type: "like",
                blog: _id,
                notification_for: blog.author,
                user: user_id,
            });
            await like.save();
            return res.status(200).json({ liked_by_user: true });
        }
        await Notification_1.default.findOneAndDelete({
            user: user_id,
            blog: _id,
            type: "like",
        });
        return res.status(200).json({ liked_by_user: false });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.likeBlog = likeBlog;
const isLikedByUser = async (req, res) => {
    try {
        const user_id = req.user;
        const { _id } = req.body;
        const result = await Notification_1.default.exists({
            user: user_id,
            type: "like",
            blog: _id,
        });
        return res.status(200).json({ result });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.isLikedByUser = isLikedByUser;
const addComment = async (req, res) => {
    try {
        const user_id = req.user;
        const { _id, comment, replying_to, blog_author, notification_id } = req.body;
        if (!comment || !comment.length) {
            return res
                .status(403)
                .json({ error: "Write something to leave a comment" });
        }
        const commentObj = {
            blog_id: _id,
            blog_author,
            comment,
            commented_by: user_id,
            isReply: Boolean(replying_to),
        };
        if (replying_to)
            commentObj.parent = replying_to;
        const commentDoc = await new Comment_1.default(commentObj).save();
        // update blog
        await Blog_1.default.findByIdAndUpdate(_id, {
            $push: { comments: commentDoc._id },
            $inc: {
                "activity.total_comments": 1,
                "activity.total_parent_comments": replying_to ? 0 : 1,
            },
        });
        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentDoc._id,
        };
        if (replying_to) {
            notificationObj.replied_on_comment = replying_to;
            const parentComment = await Comment_1.default.findByIdAndUpdate(replying_to, { $push: { children: commentDoc._id } }, { new: true });
            if (parentComment) {
                notificationObj.notification_for = parentComment.commented_by;
            }
            if (notification_id) {
                await Notification_1.default.findByIdAndUpdate(notification_id, {
                    reply: commentDoc._id,
                });
            }
        }
        await new Notification_1.default(notificationObj).save();
        return res.status(200).json({
            comment: commentDoc.comment,
            commentedAt: commentDoc.commentedAt,
            _id: commentDoc._id,
            user_id,
            children: commentDoc.children,
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.addComment = addComment;
const getBlogComments = async (req, res) => {
    try {
        const { blog_id, skip = 0 } = req.body;
        const comments = await Comment_1.default.find({
            blog_id,
            isReply: false,
        })
            .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
            .skip(skip)
            .limit(5)
            .sort({ commentedAt: -1 });
        return res.status(200).json(comments);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getBlogComments = getBlogComments;
const getReplies = async (req, res) => {
    try {
        const { _id, skip = 0 } = req.body;
        const doc = await Comment_1.default.findById(_id)
            .populate({
            path: "children",
            options: {
                limit: 5,
                skip,
                sort: { commentedAt: -1 },
            },
            populate: {
                path: "commented_by",
                select: "personal_info.profile_img personal_info.fullname personal_info.username",
            },
            select: "-blog_id -updatedAt",
        })
            .select("children");
        return res.status(200).json({ replies: doc?.children || [] });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getReplies = getReplies;
const deleteComments = async (_id) => {
    const comment = await Comment_1.default.findByIdAndDelete(_id);
    if (!comment)
        return;
    if (comment.parent) {
        await Comment_1.default.findByIdAndUpdate(comment.parent, {
            $pull: { children: _id },
        });
    }
    await Notification_1.default.findOneAndDelete({ comment: _id });
    await Notification_1.default.findOneAndUpdate({ reply: _id }, { $unset: { reply: 1 } });
    await Blog_1.default.findByIdAndUpdate(comment.blog_id, {
        $pull: { comments: _id },
        $inc: {
            "activity.total_comments": -1,
            "activity.total_parent_comments": comment.parent ? 0 : -1,
        },
    });
    if (comment.children?.length) {
        for (const child of comment.children) {
            await deleteComments(child.toString());
        }
    }
};
const deleteComment = async (req, res) => {
    try {
        const user_id = req.user;
        const { _id } = req.body;
        const comment = await Comment_1.default.findById(_id);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        if (comment.commented_by.toString() === user_id ||
            comment.blog_author.toString() === user_id) {
            await deleteComments(_id);
            return res.status(200).json({ status: "done" });
        }
        return res.status(403).json({ error: "You cannot delete this comment" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.deleteComment = deleteComment;
const userWrittenBlogs = async (req, res) => {
    try {
        const user_id = req.user;
        const { page = 1, draft, query = "", deletedDocCount = 0 } = req.body;
        const maxLimit = 5;
        let skipDocs = (page - 1) * maxLimit;
        if (deletedDocCount) {
            skipDocs -= deletedDocCount;
        }
        const blogs = await Blog_1.default.find({
            author: user_id,
            draft,
            title: new RegExp(query, "i"),
        })
            .skip(skipDocs)
            .limit(maxLimit)
            .sort({ publishedAt: -1 })
            .select("title banner publishedAt blog_id activity des draft -_id");
        return res.status(200).json({ blogs });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.userWrittenBlogs = userWrittenBlogs;
const userWrittenBlogsCount = async (req, res) => {
    try {
        const user_id = req.user;
        const { draft, query = "" } = req.body;
        const count = await Blog_1.default.countDocuments({
            author: user_id,
            draft,
            title: new RegExp(query, "i"),
        });
        return res.status(200).json({ totalDocs: count });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.userWrittenBlogsCount = userWrittenBlogsCount;
