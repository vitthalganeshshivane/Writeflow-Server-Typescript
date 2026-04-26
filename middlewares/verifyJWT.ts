import jwt from "jsonwebtoken";

import { NextFunction, Response } from "express";
import { AuthRequest } from "../types/express";

interface JwtPayload {
  id: string;
  admin: boolean;
}

const verifyJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No access token" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    req.user = decoded.id;
    req.admin = decoded.admin;
    next();
  } catch (err) {
    res.status(403).json({ error: "Access token is invalid" });
  }
};

export default verifyJWT;
