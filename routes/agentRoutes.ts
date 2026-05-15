import express from "express";
import verifyJWT from "../middlewares/verifyJWT";
import { titleAgent } from "../controllers/agentController";

const router = express.Router();

router.post("/title", verifyJWT, titleAgent);

export default router;
