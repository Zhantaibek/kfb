import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  loginSchema,
  magicLinkRequestSchema,
  registerSchema,
  verifyEmailOtpSchema,
  verifyMagicLinkSchema,
} from '../validators/index.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/magic-link', validate(magicLinkRequestSchema), authController.requestMagicLink);
router.post('/verify-magic-link', validate(verifyMagicLinkSchema), authController.verifyMagicLink);
router.post('/verify-otp', validate(verifyEmailOtpSchema), authController.verifyEmailOtp);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
