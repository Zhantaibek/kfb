import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { validateBody } from "../../middleware/validate";
import { loginSchema, publicRequestSchema, registerSchema, visitSchema } from "../../validation/cms";
import {
  postRequest,
  postVisit,
  readAdminData,
  readPublicContent,
  writeAdminData,
  createCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
} from "./cms.controller";

export const adminCmsRoutes = Router();
adminCmsRoutes.get("/data", asyncHandler(readAdminData));
adminCmsRoutes.post("/data", asyncHandler(writeAdminData));

const collections = ["news", "slides", "pages", "menu", "hubs", "management", "settings", "media", "requests", "users"] as const;
for (const collection of collections) {
  adminCmsRoutes.post(`/${collection}`, asyncHandler(createCollectionItem(collection)));
  adminCmsRoutes.patch(`/${collection}/:id`, asyncHandler(updateCollectionItem(collection)));
  adminCmsRoutes.delete(`/${collection}/:id`, asyncHandler(deleteCollectionItem(collection)));
}

export const publicCmsRoutes = Router();
publicCmsRoutes.get("/content", asyncHandler(readPublicContent));
publicCmsRoutes.post("/request", validateBody(publicRequestSchema), asyncHandler(postRequest));
publicCmsRoutes.post("/visit", validateBody(visitSchema), asyncHandler(postVisit));

export { loginSchema, registerSchema };
