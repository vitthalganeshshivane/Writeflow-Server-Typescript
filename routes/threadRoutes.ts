import express from "express";
import {
  createOrUpdateThread,
  getThreads,
  getMyDrafts,
  likeThread,
  deleteThread,
  searchMentionUsers,
} from "../controllers/threadController";
import verifyJWT from "../middlewares/verifyJWT";

const router = express.Router();

router.post("/create-thread", verifyJWT, createOrUpdateThread);
router.post("/get-threads", getThreads);
router.get("/get-threads", getThreads);
router.get("/my-drafts", verifyJWT, getMyDrafts);
router.post("/like-thread", verifyJWT, likeThread);
router.post("/delete-thread", verifyJWT, deleteThread);
router.get("/search-users", searchMentionUsers);

export default router;
