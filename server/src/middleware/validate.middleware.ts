import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ExpressError } from "../utils/express-error.js";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        next(new ExpressError(400, `Validation error: ${errorMessages}`));
      } else {
        next(error);
      }
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        next(new ExpressError(400, `URL Parameter error: ${errorMessages}`));
      } else {
        next(error);
      }
    }
  };
}
