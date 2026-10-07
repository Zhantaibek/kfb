import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { mediaController, upload } from './media.controller.js';

const router = Router();

router.post(
  '/upload',
  authenticate,
  authorize('ADMIN', 'TEACHER', 'STUDENT'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, error: { message: err.message } });
        return;
      }
      next();
    });
  },
  mediaController.upload,
);

export default router;
