import { Router } from 'express';
import authRoutes from './auth.routes.js';
import { studentsRouter, teachersRouter } from './user.routes.js';
import {
  categoriesRouter,
  coursesRouter,
  enrollmentsRouter,
  lessonsRouter,
  modulesRouter,
} from './course.routes.js';
import {
  analyticsRouter,
  assignmentsRouter,
  notificationsRouter,
  paymentsRouter,
} from './misc.routes.js';
import mediaRoutes from '../modules/media/media.routes.js';
import { messagesRouter } from './chat.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);
router.use('/students', studentsRouter);
router.use('/teachers', teachersRouter);
router.use('/courses', coursesRouter);
router.use('/categories', categoriesRouter);
router.use('/enrollments', enrollmentsRouter);
router.use('/lessons', lessonsRouter);
router.use('/modules', modulesRouter);
router.use('/assignments', assignmentsRouter);
router.use('/payments', paymentsRouter);
router.use('/notifications', notificationsRouter);
router.use('/messages', messagesRouter);
router.use('/analytics', analyticsRouter);

export default router;
