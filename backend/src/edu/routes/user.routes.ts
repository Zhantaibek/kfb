import { Router } from 'express';
import { studentController, teacherController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTeacherSchema,
  createUserSchema,
  paginationSchema,
  updateUserSchema,
} from '../validators/index.js';

const studentsRouter = Router();
const teachersRouter = Router();

studentsRouter.use(authenticate);

studentsRouter.get('/', authorize('ADMIN', 'TEACHER'), validate(paginationSchema, 'query'), studentController.list);
studentsRouter.get('/:id', authorize('ADMIN', 'TEACHER'), studentController.get);
studentsRouter.post('/', authorize('ADMIN'), validate(createUserSchema), studentController.create);
studentsRouter.patch('/:id', validate(updateUserSchema), studentController.update);
studentsRouter.delete('/:id', authorize('ADMIN'), studentController.remove);
studentsRouter.post('/:id/block', authorize('ADMIN'), studentController.block);

teachersRouter.use(authenticate);
teachersRouter.get('/', authorize('ADMIN'), validate(paginationSchema, 'query'), teacherController.list);
teachersRouter.get('/:id', authorize('ADMIN'), teacherController.get);
teachersRouter.post('/', authorize('ADMIN'), validate(createTeacherSchema), teacherController.create);

export { studentsRouter, teachersRouter };
