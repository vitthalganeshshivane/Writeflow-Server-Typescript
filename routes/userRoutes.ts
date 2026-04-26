import express from "express";
import {
  getProfile,
  searchUsers,
  updateProfile,
  updateProfileImg,
} from "../controllers/userController";
import verifyJWT from "../middlewares/verifyJWT";

const router = express.Router();

router.post("/search-users", searchUsers);

router.post("/get-profile", getProfile);
router.post("/update-profile-img", verifyJWT, updateProfileImg);
router.post("/update-profile", verifyJWT, updateProfile);

export default router;
