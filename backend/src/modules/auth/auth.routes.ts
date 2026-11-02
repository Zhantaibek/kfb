import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { validateBody } from "../../middleware/validate";
import { loginSchema, mfaCodeSchema, mfaLoginSchema } from "../../validation/cms";
import {
  confirmMfa,
  getMfa,
  getPublicSession,
  getSession,
  login,
  loginMfa,
  loginUser,
  logout,
  logoutUser,
  resetUserMfa,
  setupMfa,
  turnOffMfa,
} from "./auth.controller";

export const authRoutes = Router();
authRoutes.get("/session", asyncHandler(getSession));
authRoutes.post("/session", validateBody(loginSchema), asyncHandler(login));
authRoutes.delete("/session", logout);
authRoutes.post("/session/mfa", validateBody(mfaLoginSchema), asyncHandler(loginMfa));
// Настройка 2FA своей учётной записи и сброс чужого (только администратор).
authRoutes.get("/mfa", asyncHandler(getMfa));
authRoutes.post("/mfa/setup", asyncHandler(setupMfa));
authRoutes.post("/mfa/enable", validateBody(mfaCodeSchema), asyncHandler(confirmMfa));
authRoutes.post("/mfa/disable", validateBody(mfaCodeSchema), asyncHandler(turnOffMfa));
authRoutes.post("/users/:id/mfa-reset", asyncHandler(resetUserMfa));

export const publicAuthRoutes = Router();
publicAuthRoutes.get("/session", asyncHandler(getPublicSession));
publicAuthRoutes.post("/session", validateBody(loginSchema), asyncHandler(loginUser));
publicAuthRoutes.delete("/session", logoutUser);
publicAuthRoutes.post("/session/mfa", validateBody(mfaLoginSchema), asyncHandler(loginMfa));
 
 
 