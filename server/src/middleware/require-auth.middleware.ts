import type { Request, Response, NextFunction } from "express";
import { getSession, type User, type Session } from "../lib/session.js";
import { ExpressError } from "../utils/express-error.js";

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
      throw new ExpressError(401, "Authentication required to access this resource");
    }

    req.user = sessionData.user;
    req.session = sessionData.session;

    next();
  } catch (error) {
    next(error);
  }
}
