import express from "express";
import {
  addComment,
  allLatestBlogsCount,
  createBlog,
  deleteComment,
  getBlog,
  getBlogComments,
  getReplies,
  isLikedByUser,
  latestBlogs,
  likeBlog,
  searchBlogs,
  searchBlogsCount,
  trendingBlogs,
  userWrittenBlogs,
  userWrittenBlogsCount,
} from "../controllers/blogController";
import verifyJWT from "../middlewares/verifyJWT";

const router = express.Router();

router.post("/create-blog", verifyJWT, createBlog);
router.post("/get-blog", getBlog);
router.post("/latest-blogs", latestBlogs);
router.get("/trending-blogs", trendingBlogs);
router.post("/search-blogs", searchBlogs);
router.post("/all-latest-blogs-count", allLatestBlogsCount);
router.post("/search-blogs-count", searchBlogsCount);
router.post("/like-blog", verifyJWT, likeBlog);
router.post("/isLiked-by-user", verifyJWT, isLikedByUser);
router.post("/add-comment", verifyJWT, addComment);
router.post("/get-blog-comments", getBlogComments);
router.post("/get-replies", getReplies);
router.post("/delete-comment", verifyJWT, deleteComment);

router.post("/user-written-blogs", verifyJWT, userWrittenBlogs);
router.post("/user-written-blogs-count", verifyJWT, userWrittenBlogsCount);

export default router;
