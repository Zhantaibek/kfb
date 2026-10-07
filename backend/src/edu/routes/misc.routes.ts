import { Router } from 'express';
import {
  analyticsController,
  assignmentController,
  notificationController,
  paymentController,
} from '../controllers/assignment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createAssignmentSchema,
  createPaymentSchema,
  generateAssignmentSchema,
  paginationSchema,
  reviewSubmissionSchema,
  submitAssignmentSchema,
  updateAssignmentSchema,
} from '../validators/index.js';

const assignmentsRouter = Router();
const paymentsRouter = Router();
const notificationsRouter = Router();
const analyticsRouter = Router();

assignmentsRouter.use(authenticate);
assignmentsRouter.get('/', validate(paginationSchema, 'query'), assignmentController.list);
assignmentsRouter.post('/generate', authorize('ADMIN', 'TEACHER'), validate(generateAssignmentSchema), assignmentController.generate);
assignmentsRouter.get('/:id', assignmentController.get);
assignmentsRouter.post('/', authorize('ADMIN', 'TEACHER'), validate(createAssignmentSchema), assignmentController.create);
assignmentsRouter.patch('/:id', authorize('ADMIN', 'TEACHER'), validate(updateAssignmentSchema), assignmentController.update);
assignmentsRouter.post('/:id/submit', authorize('STUDENT', 'ADMIN'), validate(submitAssignmentSchema), assignmentController.submit);
assignmentsRouter.post('/submissions/:submissionId/review', authorize('ADMIN', 'TEACHER'), validate(reviewSubmissionSchema), assignmentController.review);

paymentsRouter.use(authenticate);
paymentsRouter.get('/', authorize('ADMIN'), validate(paginationSchema, 'query'), paymentController.list);
paymentsRouter.get('/mine', authorize('STUDENT', 'ADMIN'), validate(paginationSchema, 'query'), paymentController.listMine);
paymentsRouter.post('/', authorize('STUDENT', 'ADMIN'), validate(createPaymentSchema), paymentController.create);

notificationsRouter.use(authenticate);
notificationsRouter.get('/', notificationController.list);
notificationsRouter.patch('/:id/read', notificationController.markRead);
notificationsRouter.post('/read-all', notificationController.markAllRead);

analyticsRouter.use(authenticate, authorize('ADMIN', 'TEACHER'));
analyticsRouter.get('/dashboard', analyticsController.dashboard);
analyticsRouter.get('/students', analyticsController.students);
analyticsRouter.get('/courses', analyticsController.courses);
analyticsRouter.get('/revenue', analyticsController.revenue);

export { assignmentsRouter, paymentsRouter, notificationsRouter, analyticsRouter };
