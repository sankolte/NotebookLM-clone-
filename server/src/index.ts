import express from "express";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

import cors from "cors";

const app = express();
const port = process.env.PORT || 8081;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());


import { requireAuth } from "./middleware/require-auth.middleware.js";

app.all("/api/auth/*", toNodeHandler(auth));


app.get("/", (req, res) => {
  res.send("server is running");
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "server is running" });
});

// Protected route example
app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    session: req.session,
  });
});


 app.listen(port, () => {
   console.log(`server is running on port no ${port}`);
});
