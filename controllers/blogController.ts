import { Request, Response } from "express";
import { AuthRequest } from "../types/express";
import { nanoid } from "nanoid";
import Blog from "../models/Blog";
import User from "../models/User";
import Notification from "../models/Notification";
import Comment from "../models/Comment";

interface GetBlogBody {
  blog_id: string;
  draft?: boolean;
  mode?: string;
}

export const createBlog = async (req: AuthRequest, res: Response) => {
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

    const normalizedTags = tags.map((tag: string) => tag.toLowerCase());

    const blog_id =
      id ||
      title
        .replace(/[^a-zA-Z0-9]/g, " ")
        .replace(/\s+/g, "-")
        .trim() + nanoid();

    if (id) {
      await Blog.findOneAndUpdate(
        { blog_id },
        {
          title,
          des,
          banner,
          content,
          tags: normalizedTags,
          draft: Boolean(draft),
        },
      );

      return res.status(200).json({ id: blog_id });
    }

    const blog = new Blog({
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

    await User.findOneAndUpdate(
      { _id: authorId },
      {
        $inc: { "account_info.total_posts": incrementVal },
        $push: { blogs: savedBlog._id },
      },
    );

    return res.status(200).json({ id: savedBlog.blog_id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { blog_id, draft = false, mode }: GetBlogBody = req.body;

    if (!blog_id) {
      return res.status(400).json({ error: "Blog ID is required" });
    }

    const incrementVal = mode !== "edit" ? 1 : 0;

    const blog = await Blog.findOneAndUpdate(
      { blog_id },
      { $inc: { "activity.total_reads": incrementVal } },
      { new: true },
    )
      .populate(
        "author",
        "personal_info.fullname personal_info.username personal_info.profile_img",
      )
      .select(
        "title des content banner activity publishedAt blog_id tags draft author",
      );

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.draft && !draft) {
      return res.status(403).json({ error: "You cannot access draft blog" });
    }

    if (incrementVal === 1) {
      await User.findOneAndUpdate(
        {
          "personal_info.username": (blog.author as any).personal_info.username,
        },
        { $inc: { "account_info.total_reads": 1 } },
      );
    }

    return res.status(200).json({ blog });
  } catch (err: any) {
    console.error("Get Blog Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const latestBlogs = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.body;

    const maxLimit = 5;

    const blogs = await Blog.find({ draft: false })
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);

    return res.status(200).json({ blogs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const trendingBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.find({ draft: false })
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .sort({
        "activity.total_read": -1,
        "activity.total_likes": -1,
        publishedAt: -1,
      })
      .select("blog_id title publishedAt -_id")
      .limit(5);

    return res.status(200).json({ blogs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const {
      tag,
      query,
      author,
      page = 1,
      limit = 2,
      eliminate_blog,
    } = req.body;

    let findQuery: any;

    if (tag) {
      findQuery = {
        tags: tag,
        draft: false,
        blog_id: { $ne: eliminate_blog },
      };
    } else if (query) {
      findQuery = {
        draft: false,
        title: new RegExp(query, "i"),
      };
    } else if (author) {
      findQuery = {
        author,
        draft: false,
      };
    } else {
      findQuery = { draft: false };
    }

    const blogs = await Blog.find(findQuery)
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id",
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({ blogs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const allLatestBlogsCount = async (req: Request, res: Response) => {
  try {
    const count = await Blog.countDocuments({ draft: false });

    return res.status(200).json({ totalDocs: count });
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const searchBlogsCount = async (req: Request, res: Response) => {
  try {
    const { tag, author, query } = req.body;

    let findQuery: any;

    if (tag) {
      findQuery = { tags: tag, draft: false };
    } else if (query) {
      findQuery = { draft: false, title: new RegExp(query, "i") };
    } else if (author) {
      findQuery = { author, draft: false };
    } else {
      findQuery = { draft: false };
    }

    const count = await Blog.countDocuments(findQuery);

    return res.status(200).json({ totalDocs: count });
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const likeBlog = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user;
    const { _id, isLikedByUser } = req.body;

    const incrementVal = !isLikedByUser ? 1 : -1;

    const blog = await Blog.findByIdAndUpdate(
      _id,
      { $inc: { "activity.total_likes": incrementVal } },
      { new: true },
    );

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (!isLikedByUser) {
      const like = new Notification({
        type: "like",
        blog: _id,
        notification_for: blog.author,
        user: user_id,
      });

      await like.save();

      return res.status(200).json({ liked_by_user: true });
    }

    await Notification.findOneAndDelete({
      user: user_id,
      blog: _id,
      type: "like",
    });

    return res.status(200).json({ liked_by_user: false });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const isLikedByUser = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user;
    const { _id } = req.body;

    const result = await Notification.exists({
      user: user_id,
      type: "like",
      blog: _id,
    });

    return res.status(200).json({ result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);
    const user_id = req.user;
    const { _id, comment, replying_to, blog_author, notification_id } =
      req.body;

    if (!comment || !comment.length) {
      return res
        .status(403)
        .json({ error: "Write something to leave a comment" });
    }

    const commentObj: any = {
      blog_id: _id,
      blog_author,
      comment,
      commented_by: user_id,
      isReply: Boolean(replying_to),
    };

    if (replying_to) commentObj.parent = replying_to;

    const commentDoc = await new Comment(commentObj).save();

    // update blog
    await Blog.findByIdAndUpdate(_id, {
      $push: { comments: commentDoc._id },
      $inc: {
        "activity.total_comments": 1,
        "activity.total_parent_comments": replying_to ? 0 : 1,
      },
    });

    let notificationObj: any = {
      type: replying_to ? "reply" : "comment",
      blog: _id,
      notification_for: blog_author,
      user: user_id,
      comment: commentDoc._id,
    };

    if (replying_to) {
      notificationObj.replied_on_comment = replying_to;

      const parentComment = await Comment.findByIdAndUpdate(
        replying_to,
        { $push: { children: commentDoc._id } },
        { new: true },
      );

      if (parentComment) {
        notificationObj.notification_for = parentComment.commented_by;
      }

      if (notification_id) {
        await Notification.findByIdAndUpdate(notification_id, {
          reply: commentDoc._id,
        });
      }
    }

    await new Notification(notificationObj).save();

    return res.status(200).json({
      comment: commentDoc.comment,
      commentedAt: commentDoc.commentedAt,
      _id: commentDoc._id,
      user_id,
      children: commentDoc.children,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getBlogComments = async (req: Request, res: Response) => {
  try {
    const { blog_id, skip = 0 } = req.body;

    const comments = await Comment.find({
      blog_id,
      isReply: false,
    })
      .populate(
        "commented_by",
        "personal_info.username personal_info.fullname personal_info.profile_img",
      )
      .skip(skip)
      .limit(5)
      .sort({ commentedAt: -1 });

    return res.status(200).json(comments);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getReplies = async (req: Request, res: Response) => {
  try {
    const { _id, skip = 0 } = req.body;

    const doc = await Comment.findById(_id)
      .populate({
        path: "children",
        options: {
          limit: 5,
          skip,
          sort: { commentedAt: -1 },
        },
        populate: {
          path: "commented_by",
          select:
            "personal_info.profile_img personal_info.fullname personal_info.username",
        },
        select: "-blog_id -updatedAt",
      })
      .select("children");

    return res.status(200).json({ replies: doc?.children || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteComments = async (_id: string): Promise<void> => {
  const comment = await Comment.findByIdAndDelete(_id);

  if (!comment) return;

  if (comment.parent) {
    await Comment.findByIdAndUpdate(comment.parent, {
      $pull: { children: _id },
    });
  }

  await Notification.findOneAndDelete({ comment: _id });

  await Notification.findOneAndUpdate({ reply: _id }, { $unset: { reply: 1 } });

  await Blog.findByIdAndUpdate(comment.blog_id, {
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

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user;
    const { _id } = req.body;

    const comment = await Comment.findById(_id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (
      comment.commented_by.toString() === user_id ||
      comment.blog_author.toString() === user_id
    ) {
      await deleteComments(_id);
      return res.status(200).json({ status: "done" });
    }

    return res.status(403).json({ error: "You cannot delete this comment" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const userWrittenBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = req.user;
    const { page = 1, draft, query = "", deletedDocCount = 0 } = req.body;

    const maxLimit = 5;
    let skipDocs = (page - 1) * maxLimit;

    if (deletedDocCount) {
      skipDocs -= deletedDocCount;
    }

    const blogs = await Blog.find({
      author: user_id,
      draft,
      title: new RegExp(query, "i"),
    })
      .skip(skipDocs)
      .limit(maxLimit)
      .sort({ publishedAt: -1 })
      .select("title banner publishedAt blog_id activity des draft -_id");

    return res.status(200).json({ blogs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const userWrittenBlogsCount = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const user_id = req.user;
    const { draft, query = "" } = req.body;

    const count = await Blog.countDocuments({
      author: user_id,
      draft,
      title: new RegExp(query, "i"),
    });

    return res.status(200).json({ totalDocs: count });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
