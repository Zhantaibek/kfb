import { Router } from 'express';
import {
  categoryController,
  courseController,
  enrollmentController,
} from '../controllers/course.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  completeLessonSchema,
  createCategorySchema,
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  enrollSchema,
  paginationSchema,
  updateCategorySchema,
  updateCourseSchema,
  createVideoSchema,
  updateVideoSchema,
  updateLessonSchema,
  updateModuleSchema,
  upsertCourseReviewSchema,
} from '../validators/index.js';

const coursesRouter = Router();
const categoriesRouter = Router();
const enrollmentsRouter = Router();
const lessonsRouter = Router();
const modulesRouter = Router();

coursesRouter.get('/', authenticate, validate(paginationSchema, 'query'), courseController.list);
coursesRouter.get('/:id', authenticate, courseController.get);
coursesRouter.post('/', authenticate, authorize('ADMIN', 'TEACHER'), validate(createCourseSchema), courseController.create);
coursesRouter.patch('/:id', authenticate, authorize('ADMIN', 'TEACHER'), validate(updateCourseSchema), courseController.update);
coursesRouter.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), courseController.remove);
coursesRouter.get('/:courseId/lessons', authenticate, courseController.listLessons);
coursesRouter.post('/:courseId/modules', authenticate, authorize('ADMIN', 'TEACHER'), validate(createModuleSchema), courseController.addModule);
coursesRouter.post('/:courseId/videos', authenticate, authorize('ADMIN', 'TEACHER'), validate(createVideoSchema), courseController.addVideo);
coursesRouter.post('/:courseId/lessons', authenticate, authorize('ADMIN', 'TEACHER'), validate(createLessonSchema), courseController.addLesson);
coursesRouter.post('/:courseId/progress/complete', authenticate, authorize('STUDENT', 'ADMIN'), validate(completeLessonSchema), enrollmentController.completeLesson);
coursesRouter.get('/:courseId/progress', authenticate, enrollmentController.getProgress);
coursesRouter.get('/:courseId/reviews', authenticate, courseController.listReviews);
coursesRouter.post(
  '/:courseId/reviews',
  authenticate,
  authorize('STUDENT'),
  validate(upsertCourseReviewSchema),
  courseController.createReview,
);

lessonsRouter.patch('/:id', authenticate, authorize('ADMIN', 'TEACHER'), validate(updateLessonSchema), courseController.updateLesson);
lessonsRouter.patch('/:id/video', authenticate, authorize('ADMIN', 'TEACHER'), validate(updateVideoSchema), courseController.updateVideo);
lessonsRouter.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), courseController.deleteLesson);

modulesRouter.patch('/:id', authenticate, authorize('ADMIN', 'TEACHER'), validate(updateModuleSchema), courseController.updateModule);
modulesRouter.delete('/:id', authenticate, authorize('ADMIN', 'TEACHER'), courseController.deleteModule);

categoriesRouter.get('/', authenticate, categoryController.list);
categoriesRouter.post('/', authenticate, authorize('ADMIN'), validate(createCategorySchema), categoryController.create);
categoriesRouter.patch('/:id', authenticate, authorize('ADMIN'), validate(updateCategorySchema), categoryController.update);
categoriesRouter.delete('/:id', authenticate, authorize('ADMIN'), categoryController.remove);

enrollmentsRouter.use(authenticate);
enrollmentsRouter.get('/mine', enrollmentController.mine);
enrollmentsRouter.post('/', authorize('STUDENT', 'ADMIN'), validate(enrollSchema), enrollmentController.enroll);

export { coursesRouter, categoriesRouter, enrollmentsRouter, lessonsRouter, modulesRouter };
