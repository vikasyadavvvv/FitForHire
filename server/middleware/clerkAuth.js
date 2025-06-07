import { requireAuth } from "@clerk/express";
import dotenv from "dotenv";
dotenv.config();

export const clerkAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split("Bearer ")[1];

  try {
    const user = await clerkClient.users.getUser(token);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Clerk token" });
  }
};

