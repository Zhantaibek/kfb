import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { validateBody } from "../../middleware/validate";
import { loginSchema } from "../../validation/cms";
import { getSession, getUserSession, login, loginUser, logout, logoutUser } from "./auth.controller";

export const authRoutes = Router();
authRoutes.get("/session", getSession);
authRoutes.post("/session", validateBody(loginSchema), asyncHandler(login));
authRoutes.delete("/session", logout);

export const publicAuthRoutes = Router();
publicAuthRoutes.get("/session", getUserSession);
publicAuthRoutes.post("/session", validateBody(loginSchema), asyncHandler(loginUser));
publicAuthRoutes.delete("/session", logoutUser);
 
 
 