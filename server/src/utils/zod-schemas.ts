import { z } from "zod";

export const SUPPORTED_AI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "o3-mini",
  "claude-3-5-sonnet",
  "gemini-1.5-pro",
] as const;

// Notebook Schemas
export const createNotebookSchema = z.object({
  title: z.string().min(1, "Notebook title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  icon: z.string().optional().default("book"),
  color: z.string().optional().default("#3b82f6"),
  aiModel: z.enum(SUPPORTED_AI_MODELS).optional().default("gpt-4o-mini"),
});

export const updateNotebookSchema = z.object({
  title: z.string().min(1, "Notebook title cannot be empty").max(100, "Title is too long").optional(),
  description: z.string().max(500, "Description is too long").nullable().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  aiModel: z.enum(SUPPORTED_AI_MODELS).optional(),
});

export const notebookIdParamSchema = z.object({
  id: z.string().uuid("Invalid Notebook ID format"),
});

// Source Schemas
export const createSourceSchema = z.object({
  title: z.string().min(1, "Source title is required"),
  type: z.enum(["PDF", "TEXT", "URL", "MARKDOWN", "YT_TRANSCRIPT"]).default("TEXT"),
  content: z.string().optional(),
  summary: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const updateSourceSchema = z.object({
  title: z.string().min(1, "Source title cannot be empty").optional(),
  type: z.enum(["PDF", "TEXT", "URL", "MARKDOWN", "YT_TRANSCRIPT"]).optional(),
  content: z.string().optional(),
  summary: z.string().optional(),
  fileUrl: z.string().optional(),
  status: z.enum(["PROCESSING", "READY", "ERROR"]).optional(),
});

// Chat Message Schemas
export const createChatMessageSchema = z.object({
  role: z.enum(["USER", "ASSISTANT"]).default("USER"),
  content: z.string().min(1, "Message content cannot be empty"),
  sources: z.any().optional(),
});

// Artifact / Note Schemas
export const createArtifactSchema = z.object({
  title: z.string().min(1, "Artifact title is required"),
  type: z.enum(["NOTE", "AUDIO_OVERVIEW", "SUMMARY", "STUDY_GUIDE", "OUTLINE"]).default("NOTE"),
  content: z.string().min(1, "Artifact content is required"),
});
