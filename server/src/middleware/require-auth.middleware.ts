import type { Request, Response, NextFunction } from "express";
import { getSession, type User, type Session } from "../lib/session.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionData = await getSession(req.headers);

    if (!sessionData || !sessionData.session) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authentication required to access this resource",
      });
      return;
    }

    req.user = sessionData.user;
    req.session = sessionData.session;

    next();
  } catch (error) {
    console.error("Error in requireAuth middleware:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: "An error occurred while verifying authentication",
    });
  }
}
