import { Router } from 'express';
import { verifyToken } from '../../shared/middlewares/auth.middleware.js';
import { requireAdmin } from '../../shared/middlewares/role.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import {
  bookingIdParamsSchema,
  bookingListQuerySchema,
  cancelBookingSchema,
  confirmBookingSchema,
  rejectBookingSchema,
} from '../bookings/booking.validator.js';
import {
  adminBookingGroupsController,
  adminBookingsController,
  adminServicesController,
  cancelBookingController,
  confirmBookingController,
  rejectBookingController,
} from './admin.controller.js';
export const adminRouter = Router();
adminRouter.use(verifyToken, requireAdmin);
adminRouter.get('/services', asyncHandler(adminServicesController));
adminRouter.get(
  '/bookings/groups',
  validate(bookingListQuerySchema, 'query'),
  asyncHandler(adminBookingGroupsController),
);
adminRouter.get(
  '/bookings',
  validate(bookingListQuerySchema, 'query'),
  asyncHandler(adminBookingsController),
);
adminRouter.patch(
  '/bookings/:id/confirm',
  validate(bookingIdParamsSchema, 'params'),
  validate(confirmBookingSchema),
  asyncHandler(confirmBookingController),
);
adminRouter.patch(
  '/bookings/:id/reject',
  validate(bookingIdParamsSchema, 'params'),
  validate(rejectBookingSchema),
  asyncHandler(rejectBookingController),
);
adminRouter.patch(
  '/bookings/:id/cancel',
  validate(bookingIdParamsSchema, 'params'),
  validate(cancelBookingSchema),
  asyncHandler(cancelBookingController),
);
