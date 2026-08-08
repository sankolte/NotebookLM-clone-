import type { Request, Response } from "express";
import { notebookService } from "../services/notebook.service.js";
import { wrapAsync } from "../utils/wrap-async.js";

export const getNotebooks = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebooks = await notebookService.getUserNotebooks(userId);
  res.json({ success: true, notebooks });
});

export const getNotebookById = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const notebook = await notebookService.getNotebookById(id, userId);
  res.json({ success: true, notebook });
});

export const createNotebook = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebook = await notebookService.createNotebook(userId, req.body);
  res.status(201).json({ success: true, notebook });
});

export const updateNotebook = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const notebook = await notebookService.updateNotebook(id, userId, req.body);
  res.json({ success: true, notebook });
});

export const deleteNotebook = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  await notebookService.deleteNotebook(id, userId);
  res.json({ success: true, message: "Notebook deleted successfully" });
});

// Sources
export const addSource = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = req.params.id as string;
  const source = await notebookService.addSource(notebookId, userId, req.body);
  res.status(201).json({ success: true, source });
});

export const deleteSource = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = req.params.id as string;
  const sourceId = req.params.sourceId as string;
  await notebookService.deleteSource(sourceId, notebookId, userId);
  res.json({ success: true, message: "Source deleted successfully" });
});

// Chat
export const addChatMessage = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = req.params.id as string;
  const result = await notebookService.addChatMessage(notebookId, userId, req.body);
  res.status(201).json({ success: true, ...result });
});

// Artifacts
export const createArtifact = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = req.params.id as string;
  const artifact = await notebookService.createArtifact(notebookId, userId, req.body);
  res.status(201).json({ success: true, artifact });
});

export const deleteArtifact = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = req.params.id as string;
  const artifactId = req.params.artifactId as string;
  await notebookService.deleteArtifact(artifactId, notebookId, userId);
  res.json({ success: true, message: "Artifact deleted successfully" });
});
