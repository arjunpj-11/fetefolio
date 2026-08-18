import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { verifyToken } from '../../shared/middlewares/auth.middleware.js';
import {
  loginSchema,
  registerSchema,
  resendRegistrationOtpSchema,
  verifyRegistrationSchema,
} from './auth.validator.js';
import {
  loginController,
  meController,
  registerController,
  resendRegistrationOtpController,
  verifyRegistrationController,
} from './auth.controller.js';

export const authRouter = Router();
authRouter.post('/register', validate(registerSchema), asyncHandler(registerController));
authRouter.post(
  '/verify-registration',
  validate(verifyRegistrationSchema),
  asyncHandler(verifyRegistrationController),
);
authRouter.post(
  '/resend-registration-otp',
  validate(resendRegistrationOtpSchema),
  asyncHandler(resendRegistrationOtpController),
);
authRouter.post('/login', validate(loginSchema), asyncHandler(loginController));
authRouter.get('/me', verifyToken, asyncHandler(meController));
