import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createSourceSchema, updateSourceSchema } from "../utils/zod-schemas.js";
import * as sourceController from "../controllers/source.controller.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/", sourceController.getSources);
router.post("/", validateBody(createSourceSchema), sourceController.addSource);
router.get("/:sourceId", sourceController.getSourceById);
router.patch("/:sourceId", validateBody(updateSourceSchema), sourceController.updateSource);
router.delete("/:sourceId", sourceController.deleteSource);

export default router;
