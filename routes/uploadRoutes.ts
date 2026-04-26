import express from "express";
import { getUploadURL } from "../controllers/uploadController";
import verifyJWT from "../middlewares/verifyJWT";

const router = express.Router();

router.get("/get-upload-url", verifyJWT, getUploadURL);

export default router;
