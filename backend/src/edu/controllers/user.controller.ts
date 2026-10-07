import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/response.js';

export const studentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await userService.listStudents(req.query as Record<string, unknown>, req.user!);
    return sendPaginated(res, data, meta);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(String(req.params.id), req.user!);
    return sendSuccess(res, user);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create({ ...req.body, role: 'STUDENT' });
    return sendSuccess(res, user, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.update(String(req.params.id), req.body, req.user!);
    return sendSuccess(res, user);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.remove(String(req.params.id));
    return sendSuccess(res, result);
  }),

  block: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.block(String(req.params.id));
    return sendSuccess(res, user);
  }),
};

export const teacherController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await userService.listTeachers(req.query as Record<string, unknown>);
    return sendPaginated(res, data, meta);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(String(req.params.id), req.user!);
    return sendSuccess(res, user);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create({ ...req.body, role: 'TEACHER' });
    return sendSuccess(res, user, 201);
  }),
};
