import express from "express";
import {
  googleAuth,
  signin,
  signup,
  changePassword,
} from "../controllers/authController";
import verifyJWT from "../middlewares/verifyJWT";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google-auth", googleAuth);
router.post("/change-password", verifyJWT, changePassword);

export default router;
