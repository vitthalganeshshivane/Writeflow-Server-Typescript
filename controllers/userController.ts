import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../types/express";

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const users = await User.find({
      "personal_info.username": new RegExp(query, "i"),
    })
      .limit(50)
      .select(
        "personal_info.fullname personal_info.username personal_info.profile_img -_id",
      );

    return res.status(200).json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({
      "personal_info.username": username,
    }).select("-personal_info.password -google_auth -updateAt -blogs");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateProfileImg = async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;

    await User.findByIdAndUpdate(req.user, {
      "personal_info.profile_img": url,
    });

    return res.status(200).json({ profile_img: url });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
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
    } catch {
      return res.status(400).json({
        error: "Provide valid full URLs (http/https required)",
      });
    }

    const updateObj = {
      "personal_info.username": username,
      "personal_info.bio": bio,
      social_links,
    };

    await User.findByIdAndUpdate(req.user, updateObj, {
      runValidators: true,
    });

    return res.status(200).json({ username });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Username already taken" });
    }

    return res.status(500).json({ error: err.message });
  }
};
