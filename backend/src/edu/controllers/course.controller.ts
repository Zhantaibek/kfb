import type { Request, Response } from 'express';
import { categoryService } from '../services/enrollment.service.js';
import { courseService } from '../services/course.service.js';
import { enrollmentService } from '../services/enrollment.service.js';
import { reviewService } from '../services/review.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/response.js';

export const courseController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await courseService.list(req.query as Record<string, unknown>, req.user);
    return sendPaginated(res, data, meta);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.getById(String(req.params.id), req.user);
    return sendSuccess(res, course);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.create(req.body, req.user!);
    return sendSuccess(res, course, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const course = await courseService.update(String(req.params.id), req.body, req.user!);
    return sendSuccess(res, course);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await courseService.remove(String(req.params.id), req.user!);
    return sendSuccess(res, result);
  }),

  listLessons: asyncHandler(async (req: Request, res: Response) => {
    const lessons = await courseService.listLessons(String(req.params.courseId), req.user);
    return sendSuccess(res, lessons);
  }),

  addModule: asyncHandler(async (req: Request, res: Response) => {
    const module = await courseService.addModule(
      String(req.params.courseId),
      req.body.title,
      req.body.order,
      req.user!,
    );
    return sendSuccess(res, module, 201);
  }),

  updateModule: asyncHandler(async (req: Request, res: Response) => {
    const module = await courseService.updateModule(String(req.params.id), req.body, req.user!);
    return sendSuccess(res, module);
  }),

  deleteModule: asyncHandler(async (req: Request, res: Response) => {
    const result = await courseService.deleteModule(String(req.params.id), req.user!);
    return sendSuccess(res, result);
  }),

  addVideo: asyncHandler(async (req: Request, res: Response) => {
    const video = await courseService.addVideo(String(req.params.courseId), req.body, req.user!);
    return sendSuccess(res, video, 201);
  }),

  updateVideo: asyncHandler(async (req: Request, res: Response) => {
    const video = await courseService.updateVideo(String(req.params.id), req.body, req.user!);
    return sendSuccess(res, video);
  }),

  addLesson: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await courseService.addLesson(String(req.params.courseId), req.body, req.user!);
    return sendSuccess(res, lesson, 201);
  }),

  updateLesson: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await courseService.updateLesson(String(req.params.id), req.body, req.user!);
    return sendSuccess(res, lesson);
  }),

  deleteLesson: asyncHandler(async (req: Request, res: Response) => {
    const result = await courseService.deleteLesson(String(req.params.id), req.user!);
    return sendSuccess(res, result);
  }),

  listReviews: asyncHandler(async (req: Request, res: Response) => {
    const data = await reviewService.list(String(req.params.courseId), req.user);
    return sendSuccess(res, data);
  }),

  createReview: asyncHandler(async (req: Request, res: Response) => {
    const review = await reviewService.create(String(req.params.courseId), req.user!, req.body);
    return sendSuccess(res, review, 201);
  }),
};

export const categoryController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoryService.list();
    return sendSuccess(res, categories);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);
    return sendSuccess(res, category, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.update(String(req.params.id), req.body);
    return sendSuccess(res, category);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const result = await categoryService.remove(String(req.params.id));
    return sendSuccess(res, result);
  }),
};

export const enrollmentController = {
  enroll: asyncHandler(async (req: Request, res: Response) => {
    const enrollment = await enrollmentService.enroll(req.user!.id, req.body.courseId);
    return sendSuccess(res, enrollment, 201);
  }),

  mine: asyncHandler(async (req: Request, res: Response) => {
    const enrollments = await enrollmentService.listMine(req.user!.id);
    return sendSuccess(res, enrollments);
  }),

  completeLesson: asyncHandler(async (req: Request, res: Response) => {
    const progress = await enrollmentService.completeLesson(
      req.user!.id,
      String(req.params.courseId),
      req.body.lessonId,
    );
    return sendSuccess(res, progress);
  }),

  getProgress: asyncHandler(async (req: Request, res: Response) => {
    const progress = await enrollmentService.getProgress(req.user!.id, String(req.params.courseId));
    return sendSuccess(res, progress);
  }),
};
