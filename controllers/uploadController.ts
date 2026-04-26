import { Request, Response } from "express";
import { generateUploadURL } from "../utils/generateUploadURL";

export const getUploadURL = async (req: Request, res: Response) => {
  try {
    const url = await generateUploadURL();

    return res.status(200).json({ uploadURL: url });
  } catch (err: any) {
    console.error(err.message);
    return res.status(500).json({ error: err.message });
  }
};
