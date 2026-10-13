import mongoose, { Schema, Document } from "mongoose";

export interface IThread extends Document {
  thread_id: string;
  content: string;
  image?: string;
  youtube?: {
    url: string;
    embedUrl: string;
    caption?: string;
  };
  mentions?: string[];
  author: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  draft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const threadSchema = new Schema<IThread>(
  {
    thread_id: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    youtube: {
      url: { type: String, default: "" },
      embedUrl: { type: String, default: "" },
      caption: { type: String, default: "" },
    },
    mentions: {
      type: [String],
      default: [],
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: "users",
      default: [],
    },
    draft: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IThread>("threads", threadSchema);
