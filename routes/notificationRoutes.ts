import express from "express";
import {
  getNotifications,
  allNotificationsCount,
  newNotification,
} from "../controllers/notificationController";
import verifyJWT from "../middlewares/verifyJWT";

const router = express.Router();

router.post("/new-notification", verifyJWT, newNotification);
router.post("/all-notifications-count", verifyJWT, allNotificationsCount);
router.post("/notifications", verifyJWT, getNotifications);

export default router;
