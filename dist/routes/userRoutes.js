"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const verifyJWT_1 = __importDefault(require("../middlewares/verifyJWT"));
const router = express_1.default.Router();
router.post("/search-users", userController_1.searchUsers);
router.post("/get-profile", userController_1.getProfile);
router.post("/update-profile-img", verifyJWT_1.default, userController_1.updateProfileImg);
router.post("/update-profile", verifyJWT_1.default, userController_1.updateProfile);
exports.default = router;
