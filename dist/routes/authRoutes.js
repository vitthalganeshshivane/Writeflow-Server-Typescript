"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const verifyJWT_1 = __importDefault(require("../middlewares/verifyJWT"));
const router = express_1.default.Router();
router.post("/signup", authController_1.signup);
router.post("/signin", authController_1.signin);
router.post("/google-auth", authController_1.googleAuth);
router.post("/change-password", verifyJWT_1.default, authController_1.changePassword);
exports.default = router;
