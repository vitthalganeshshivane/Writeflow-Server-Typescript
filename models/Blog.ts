import mongoose, { Schema, Document } from "mongoose";

interface IActivity {
  total_likes: number;
  total_comments: number;
  total_reads: number;
  total_parent_comments: number;
}

export interface IBlog extends Document {
  blog_id: string;
  title: string;
  banner?: string;
  des?: string;
  content?: any[];
  tags?: string[];
  author: mongoose.Types.ObjectId;
  activity: IActivity;
  comments: mongoose.Types.ObjectId[];
  draft: boolean;
}

const blogSchema = new Schema<IBlog>(
  {
    blog_id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
    },
    des: {
      type: String,
      maxlength: 200,
    },
    content: {
      type: [],
    },
    tags: {
      type: [String],
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    activity: {
      total_likes: {
        type: Number,
        default: 0,
      },
      total_comments: {
        type: Number,
        default: 0,
      },
      total_reads: {
        type: Number,
        default: 0,
      },
      total_parent_comments: {
        type: Number,
        default: 0,
      },
    },
    comments: {
      type: [Schema.Types.ObjectId],
      ref: "comments",
    },
    draft: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "publishedAt",
    },
  },
);

export default mongoose.model<IBlog>("blogs", blogSchema);
