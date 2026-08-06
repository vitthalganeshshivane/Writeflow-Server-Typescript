"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const verifyJWT_1 = __importDefault(require("../middlewares/verifyJWT"));
const agentController_1 = require("../controllers/agentController");
const router = express_1.default.Router();
router.post("/title", verifyJWT_1.default, agentController_1.titleAgent);
exports.default = router;
