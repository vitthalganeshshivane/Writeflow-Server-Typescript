"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.updateProfileImg = exports.getProfile = exports.searchUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const searchUsers = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }
        const users = await User_1.default.find({
            "personal_info.username": new RegExp(query, "i"),
        })
            .limit(50)
            .select("personal_info.fullname personal_info.username personal_info.profile_img -_id");
        return res.status(200).json({ users });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.searchUsers = searchUsers;
const getProfile = async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User_1.default.findOne({
            "personal_info.username": username,
        }).select("-personal_info.password -google_auth -updateAt -blogs");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.getProfile = getProfile;
const updateProfileImg = async (req, res) => {
    try {
        const { url } = req.body;
        await User_1.default.findByIdAndUpdate(req.user, {
            "personal_info.profile_img": url,
        });
        return res.status(200).json({ profile_img: url });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
exports.updateProfileImg = updateProfileImg;
const updateProfile = async (req, res) => {
    try {
        const { username, bio, social_links } = req.body;
        const bioLimit = 150;
        if (!username || username.length < 3) {
            return res.status(403).json({
                error: "Username should be at least 3 letters long",
            });
        }
        if (bio && bio.length > bioLimit) {
            return res.status(403).json({
                error: `Bio should not be more than ${bioLimit} characters`,
            });
        }
        const socialLinksArr = Object.keys(social_links || {});
        try {
            for (let i = 0; i < socialLinksArr.length; i++) {
                const key = socialLinksArr[i];
                const value = social_links[key];
                if (value.length) {
                    const url = new URL(value);
                    if (!url.hostname.includes(`${key}.com`) && key !== "website") {
                        return res.status(403).json({
                            error: `${key} link is invalid`,
                        });
                    }
                }
            }
        }
        catch {
            return res.status(400).json({
                error: "Provide valid full URLs (http/https required)",
            });
        }
        const updateObj = {
            "personal_info.username": username,
            "personal_info.bio": bio,
            social_links,
        };
        await User_1.default.findByIdAndUpdate(req.user, updateObj, {
            runValidators: true,
        });
        return res.status(200).json({ username });
    }
    catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: "Username already taken" });
        }
        return res.status(500).json({ error: err.message });
    }
};
exports.updateProfile = updateProfile;
