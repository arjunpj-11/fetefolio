import { Router } from 'express';
import { verifyToken } from '../../shared/middlewares/auth.middleware.js';
import { requireAdmin, requireUser } from '../../shared/middlewares/role.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import {
  createBookingController,
  myBookingsController,
  serviceBookingsController,
} from './booking.controller.js';
import {
  bookingListQuerySchema,
  createBookingSchema,
  serviceBookingParamsSchema,
} from './booking.validator.js';

export const bookingRouter = Router();
bookingRouter.use(verifyToken);
bookingRouter.post(
  '/',
  requireUser,
  validate(createBookingSchema),
  asyncHandler(createBookingController),
);
bookingRouter.get(
  '/my',
  requireUser,
  validate(bookingListQuerySchema, 'query'),
  asyncHandler(myBookingsController),
);
bookingRouter.get(
  '/service/:id',
  requireAdmin,
  validate(serviceBookingParamsSchema, 'params'),
  validate(bookingListQuerySchema, 'query'),
  asyncHandler(serviceBookingsController),
);
