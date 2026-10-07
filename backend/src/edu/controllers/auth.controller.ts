import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body.email, req.body.password);
    return sendSuccess(res, result);
  }),

  requestMagicLink: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestMagicLink(req.body.email);
    return sendSuccess(res, result);
  }),

  verifyMagicLink: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyMagicLink(req.body.token);
    return sendSuccess(res, result);
  }),

  verifyEmailOtp: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyEmailOtp(req.body.email, req.body.code);
    return sendSuccess(res, result);
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, { message: 'Logged out' });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    return sendSuccess(res, user);
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    return sendSuccess(res, result);
  }),
};
