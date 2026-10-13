import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import { nanoid } from "nanoid";
import Thread from "../models/Thread";
import User from "../models/User";

export const createOrUpdateThread = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const authorId = req.user;
    if (!authorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id, content = "", image = "", youtube = null, draft = false } = req.body;
    const isDraft = Boolean(draft);

    // If publishing, ensure there is at least some content, image, or youtube embed
    if (!isDraft) {
      const hasContent = Boolean(content && content.trim().length);
      const hasImage = Boolean(image && image.trim().length);
      const hasYoutube = Boolean(youtube && youtube.embedUrl && youtube.embedUrl.trim().length);

      if (!hasContent && !hasImage && !hasYoutube) {
        return res
          .status(400)
          .json({ error: "Thread must have content, an image, or a video" });
      }
    }

    // Extract @mentions from text
    const extractedMentions: string[] = [];
    if (content && typeof content === "string") {
      const matches = content.match(/@([a-zA-Z0-9_]+)/g);
      if (matches) {
        matches.forEach((m) => {
          const u = m.slice(1).toLowerCase();
          if (!extractedMentions.includes(u)) {
            extractedMentions.push(u);
          }
        });
      }
    }

    const cleanYoutube =
      youtube && youtube.embedUrl
        ? {
            url: youtube.url || "",
            embedUrl: youtube.embedUrl,
            caption: youtube.caption || "",
          }
        : { url: "", embedUrl: "", caption: "" };

    if (id) {
      const existingThread = await Thread.findOne({ thread_id: id });
      if (!existingThread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      if (
        existingThread.author.toString() !== authorId.toString() &&
        !req.admin
      ) {
        return res
          .status(403)
          .json({ error: "You don't have permission to edit this thread" });
      }

      existingThread.content = content;
      existingThread.image = image;
      existingThread.youtube = cleanYoutube;
      existingThread.mentions = extractedMentions;
      existingThread.draft = isDraft;

      await existingThread.save();

      return res.status(200).json({
        status: "success",
        thread_id: existingThread.thread_id,
        draft: existingThread.draft,
      });
    }

    const newThread = new Thread({
      thread_id: nanoid(10),
      content,
      image,
      youtube: cleanYoutube,
      mentions: extractedMentions,
      author: authorId,
      draft: isDraft,
    });

    const saved = await newThread.save();

    return res.status(200).json({
      status: "success",
      thread_id: saved.thread_id,
      draft: saved.draft,
    });
  } catch (err: any) {
    console.error("Create thread error:", err);
    return res.status(500).json({ error: err.message || "Failed to save thread" });
  }
};

export const getThreads = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.body.page || req.query.page || 1), 10));
    const limit = Math.max(1, parseInt(String(req.body.limit || req.query.limit || 10), 10));
    const skip = (page - 1) * limit;

    const [threads, totalDocs] = await Promise.all([
      Thread.find({ draft: false })
        .populate(
          "author",
          "personal_info.fullname personal_info.username personal_info.profile_img",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Thread.countDocuments({ draft: false }),
    ]);

    return res.status(200).json({
      threads,
      totalDocs,
      page,
      hasMore: skip + threads.length < totalDocs,
    });
  } catch (err: any) {
    console.error("Get threads error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch threads" });
  }
};

export const getMyDrafts = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user;
    if (!authorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const drafts = await Thread.find({ author: authorId, draft: true }).sort({
      updatedAt: -1,
    });

    return res.status(200).json({ drafts });
  } catch (err: any) {
    console.error("Get thread drafts error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to fetch drafts" });
  }
};

export const likeThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { thread_id } = req.body;
    if (!thread_id) {
      return res.status(400).json({ error: "thread_id is required" });
    }

    const thread = await Thread.findOne({ thread_id });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    const userObjectIdStr = userId.toString();
    const index = thread.likes.findIndex((id) => id.toString() === userObjectIdStr);

    let isLiked = false;
    if (index === -1) {
      thread.likes.push(userId as any);
      isLiked = true;
    } else {
      thread.likes.splice(index, 1);
      isLiked = false;
    }

    await thread.save();

    return res.status(200).json({
      isLiked,
      likesCount: thread.likes.length,
    });
  } catch (err: any) {
    console.error("Like thread error:", err);
    return res.status(500).json({ error: err.message || "Failed to update like" });
  }
};

export const deleteThread = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { thread_id } = req.body;
    if (!thread_id) {
      return res.status(400).json({ error: "thread_id is required" });
    }

    const thread = await Thread.findOne({ thread_id });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    if (thread.author.toString() !== userId.toString() && !req.admin) {
      return res
        .status(403)
        .json({ error: "You don't have permission to delete this thread" });
    }

    await Thread.deleteOne({ thread_id });

    return res.status(200).json({ status: "success" });
  } catch (err: any) {
    console.error("Delete thread error:", err);
    return res.status(500).json({ error: err.message || "Failed to delete thread" });
  }
};

export const searchMentionUsers = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || req.query.query || "").trim();
    if (!query) {
      return res.status(200).json({ users: [] });
    }

    const regex = new RegExp(`^${query}`, "i");
    const users = await User.find({
      $or: [
        { "personal_info.username": regex },
        { "personal_info.fullname": regex },
      ],
    })
      .select("personal_info.username personal_info.fullname personal_info.profile_img")
      .limit(6);

    const formatted = users.map((u: any) => ({
      username: u.personal_info.username,
      fullname: u.personal_info.fullname,
      profile_img: u.personal_info.profile_img,
    }));

    return res.status(200).json({ users: formatted });
  } catch (err: any) {
    console.error("Search mention users error:", err);
    return res.status(500).json({ error: err.message || "Failed to search users" });
  }
};
