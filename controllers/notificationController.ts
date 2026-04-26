import { Response } from "express";
import { AuthRequest } from "../types/express";
import Notification from "../models/Notification";

export const newNotification = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user;

    const result = await Notification.exists({
      notification_for: user_id,
      seen: false,
      user: { $ne: user_id },
    });

    return res.status(200).json({
      new_notification_available: Boolean(result),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const allNotificationsCount = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const user_id = req.user;
    const { filter = "all" } = req.body;

    let findQuery: any = {
      notification_for: user_id,
      user: { $ne: user_id },
    };

    if (filter !== "all") {
      findQuery.type = filter;
    }

    const count = await Notification.countDocuments(findQuery);

    return res.status(200).json({ totalDocs: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user;
    const { page = 1, filter = "all", deletedDocCount = 0 } = req.body;

    const maxLimit = 10;

    let findQuery: any = {
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

    const notifications = await Notification.find(findQuery)
      .skip(skipDocs)
      .limit(maxLimit)
      .populate("blog", "title blog_id")
      .populate(
        "user",
        "personal_info.fullname personal_info.username personal_info.profile_img",
      )
      .populate("comment", "comment")
      .populate("replied_on_comment", "comment")
      .populate("reply", "comment")
      .sort({ createdAt: -1 })
      .select("createdAt type seen reply");

    // 🔥 mark as seen
    await Notification.updateMany(findQuery, { seen: true })
      .skip(skipDocs)
      .limit(maxLimit);

    return res.status(200).json({ notifications });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
