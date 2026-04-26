import s3 from "../config/aws";
import { nanoid } from "nanoid";

export const generateUploadURL = async (): Promise<string> => {
  const date = new Date();

  const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

  const url = await s3.getSignedUrlPromise("putObject", {
    Bucket: "mern-blog-webapp45",
    Key: imageName,
    Expires: 1000,
    ContentType: "image/jpeg",
  });

  return url;
};
