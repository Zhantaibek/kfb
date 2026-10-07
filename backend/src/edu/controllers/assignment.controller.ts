import type { Request, Response } from 'express';
import { assignmentService } from '../services/assignment.service.js';
import { methodistService } from '../services/methodist.service.js';
import {
  analyticsService,
  notificationService,
  paymentService,
} from '../services/payment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/response.js';

export const assignmentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await assignmentService.list(req.query as Record<string, unknown>, req.user!);
    return sendPaginated(res, data, meta);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentService.getById(String(req.params.id), req.user!);
    return sendSuccess(res, assignment);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentService.create(req.body, req.user!);
    return sendSuccess(res, assignment, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentService.update(String(req.params.id), req.body, req.user!);
    return sendSuccess(res, assignment);
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const submission = await assignmentService.submit(String(req.params.id), req.user!.id, req.body);
    return sendSuccess(res, submission, 201);
  }),

  review: asyncHandler(async (req: Request, res: Response) => {
    const submission = await assignmentService.review(String(req.params.submissionId), req.body, req.user!);
    return sendSuccess(res, submission);
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    const result = methodistService.generate(req.body);
    return sendSuccess(res, result);
  }),
};

export const paymentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await paymentService.list(req.query as Record<string, unknown>);
    return sendPaginated(res, data, meta);
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await paymentService.listMine(req.user!.id, req.query as Record<string, unknown>);
    return sendPaginated(res, data, meta);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.createMock(req.user!.id, req.body);
    return sendSuccess(res, payment, 201);
  }),
};

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.list(req.user!.id);
    return sendSuccess(res, result);
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markRead(String(req.params.id), req.user!.id);
    return sendSuccess(res, result);
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markAllRead(req.user!.id);
    return sendSuccess(res, result);
  }),
};

export const analyticsController = {
  dashboard: asyncHandler(async (req: Request, res: Response) => {
    const data = await analyticsService.dashboard(req.user);
    return sendSuccess(res, data);
  }),

  students: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.students();
    return sendSuccess(res, data);
  }),

  courses: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.courses();
    return sendSuccess(res, data);
  }),

  revenue: asyncHandler(async (_req: Request, res: Response) => {
    const data = await analyticsService.revenue();
    return sendSuccess(res, data);
  }),
};
