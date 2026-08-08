import { Prisma } from "@prisma/client";
import { ExpressError } from "./express-error.js";

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = (error.meta?.target as string[])?.join(", ") || "field";
        throw new ExpressError(409, `Unique constraint failed on ${target}`);
      }
      case "P2025": {
        throw new ExpressError(404, "Requested record was not found in the database");
      }
      case "P2003": {
        throw new ExpressError(400, "Foreign key constraint failed");
      }
      case "P2000": {
        throw new ExpressError(400, "Provided value is too long for column constraint");
      }
      default: {
        throw new ExpressError(500, `Database error: ${error.message}`);
      }
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new ExpressError(400, "Invalid data provided to database query");
  }

  if (error instanceof ExpressError) {
    throw error;
  }

  throw new ExpressError(500, error instanceof Error ? error.message : "An unexpected error occurred");
}
