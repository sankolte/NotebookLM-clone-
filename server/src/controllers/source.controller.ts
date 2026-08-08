import { Request, Response } from "express";
import { sourceService } from "../services/source.service.js";
import { wrapAsync } from "../utils/wrap-async.js";

export const getSources = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = (req.params.notebookId || req.params.id) as string;
  const sources = await sourceService.getSourcesByNotebookId(notebookId, userId);
  res.json({ success: true, sources });
});

export const getSourceById = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = (req.params.notebookId || req.params.id) as string;
  const sourceId = req.params.sourceId as string;
  const source = await sourceService.getSourceById(sourceId, notebookId, userId);
  res.json({ success: true, source });
});

export const addSource = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = (req.params.notebookId || req.params.id) as string;
  const source = await sourceService.addSource(notebookId, userId, req.body);
  res.status(201).json({ success: true, source });
});

export const updateSource = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = (req.params.notebookId || req.params.id) as string;
  const sourceId = req.params.sourceId as string;
  const source = await sourceService.updateSource(sourceId, notebookId, userId, req.body);
  res.json({ success: true, source });
});

export const deleteSource = wrapAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notebookId = (req.params.notebookId || req.params.id) as string;
  const sourceId = req.params.sourceId as string;
  await sourceService.deleteSource(sourceId, notebookId, userId);
  res.json({ success: true, message: "Source deleted successfully" });
});
