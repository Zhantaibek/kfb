import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { validateBody } from "../../middleware/validate";
import { loginSchema, publicRequestSchema, registerSchema } from "../../validation/cms";
import { postVisit } from "../analytics/analytics.routes";
import { getSearch } from "../search/search.routes";
import { getMarketSnapshot } from "../kse-sync/kse-sync.routes";
import {
  postRequest,
  readAdminData,
  readIssuerData,
  readPublicContent,
  writeAdminData,
  createCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
} from "./cms.controller";

export const adminCmsRoutes = Router();
adminCmsRoutes.get("/data", asyncHandler(readAdminData));
adminCmsRoutes.post("/data", asyncHandler(writeAdminData));

const collections = [
  "news",
  "slides",
  "pages",
  "menu",
  "hubs",
  "management",
  "partners",
  "sustainableBonds",
  "esgReports",
  "verifiers",
  "gcbParticipants",
  "landingSections",
  "issuers",
  "listing",
  "settings",
  "media",
  "requests",
  "users",
] as const;
for (const collection of collections) {
  adminCmsRoutes.post(`/${collection}`, asyncHandler(createCollectionItem(collection)));
  adminCmsRoutes.patch(`/${collection}/:id`, asyncHandler(updateCollectionItem(collection)));
  adminCmsRoutes.delete(`/${collection}/:id`, asyncHandler(deleteCollectionItem(collection)));
}

export const publicCmsRoutes = Router();
publicCmsRoutes.get("/content", asyncHandler(readPublicContent));
publicCmsRoutes.get("/issuers", asyncHandler(readIssuerData));
publicCmsRoutes.get("/search", asyncHandler(getSearch));
publicCmsRoutes.get("/market/:key", asyncHandler(getMarketSnapshot));
publicCmsRoutes.post("/request", validateBody(publicRequestSchema), asyncHandler(postRequest));
// Счётчик посещений с id посетителя, IP и устройством — см. modules/analytics.
publicCmsRoutes.post("/visit", asyncHandler(postVisit));

export { loginSchema, registerSchema };
