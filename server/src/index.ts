import express from "express";
import "dotenv/config";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { requireAuth } from "./middleware/require-auth.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { ExpressError } from "./utils/express-error.js";
import { wrapAsync } from "./utils/wrap-async.js";
import notebookRouter from "./routes/notebook.routes.js";

const app = express();
const port = process.env.PORT || 8081;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Auth routes handled by Better Auth (Express 5 named wildcard pattern)
app.all("/api/auth/*splat", toNodeHandler(auth));

// Public routes
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Notebook Workspaces API routes
app.use("/api/notebooks", notebookRouter);

// Protected route example wrapped with wrapAsync
app.get(
  "/api/me",
  requireAuth,
  wrapAsync(async (req, res) => {
    res.json({
      success: true,
      user: req.user,
      session: req.session,
    });
  })
);

// Catch-all 404 handler for undefined routes (Express 5 middleware style)
app.use((req, res, next) => {
  next(new ExpressError(404, `Route ${req.originalUrl} Not Found`));
});

// Centralized "Final Boss" Error Handler Middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
