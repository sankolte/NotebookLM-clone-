import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { validateBody, validateParams } from "../middleware/validate.middleware.js";
import {
  createNotebookSchema,
  updateNotebookSchema,
  createSourceSchema,
  createChatMessageSchema,
  createArtifactSchema,
  notebookIdParamSchema,
} from "../utils/zod-schemas.js";
import * as notebookController from "../controllers/notebook.controller.js";

const router = Router();

// Apply auth middleware to all notebook routes
router.use(requireAuth);

// Notebook CRUD
router.get("/", notebookController.getNotebooks);
router.post("/", validateBody(createNotebookSchema), notebookController.createNotebook);
router.get("/:id", validateParams(notebookIdParamSchema), notebookController.getNotebookById);
router.patch(
  "/:id",
  validateParams(notebookIdParamSchema),
  validateBody(updateNotebookSchema),
  notebookController.updateNotebook
);
router.delete("/:id", validateParams(notebookIdParamSchema), notebookController.deleteNotebook);

// Sources
router.post(
  "/:id/sources",
  validateParams(notebookIdParamSchema),
  validateBody(createSourceSchema),
  notebookController.addSource
);
router.delete(
  "/:id/sources/:sourceId",
  validateParams(notebookIdParamSchema),
  notebookController.deleteSource
);

// Chat Messages
router.post(
  "/:id/messages",
  validateParams(notebookIdParamSchema),
  validateBody(createChatMessageSchema),
  notebookController.addChatMessage
);

// Artifacts / Notes
router.post(
  "/:id/artifacts",
  validateParams(notebookIdParamSchema),
  validateBody(createArtifactSchema),
  notebookController.createArtifact
);
router.delete(
  "/:id/artifacts/:artifactId",
  validateParams(notebookIdParamSchema),
  notebookController.deleteArtifact
);

export default router;
