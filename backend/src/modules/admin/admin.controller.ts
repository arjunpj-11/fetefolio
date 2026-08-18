import type { Request, Response } from 'express';
import type {
  BookingListQueryDTO,
  CancelBookingDTO,
  ConfirmBookingDTO,
  RejectBookingDTO,
} from '@programme/contracts';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import {
  cancelBooking,
  confirmBooking,
  listProviderBookingGroups,
  listProviderBookings,
  rejectBooking,
} from '../bookings/booking.service.js';
import { listProviderServices } from '../services/service.service.js';
export const adminServicesController = async (req: Request, res: Response): Promise<void> => {
  res.json(
    new ApiResponse(await listProviderServices(req.user._id.toString()), 'Admin services loaded'),
  );
};
export const adminBookingsController = async (
  req: Request<object, object, object, BookingListQueryDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await listProviderBookings(req.user._id.toString(), req.query),
      'Admin bookings loaded',
    ),
  );
};
export const adminBookingGroupsController = async (
  req: Request<object, object, object, BookingListQueryDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await listProviderBookingGroups(req.user._id.toString(), req.query.scope),
      'Booking groups loaded',
    ),
  );
};
export const confirmBookingController = async (
  req: Request<{ id: string }, object, ConfirmBookingDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await confirmBooking(req.params.id, req.user._id.toString(), req.body),
      'Booking confirmed',
    ),
  );
};
export const rejectBookingController = async (
  req: Request<{ id: string }, object, RejectBookingDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await rejectBooking(req.params.id, req.user._id.toString(), req.body),
      'Booking rejected',
    ),
  );
};
export const cancelBookingController = async (
  req: Request<{ id: string }, object, CancelBookingDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await cancelBooking(req.params.id, req.user._id.toString(), req.body),
      'Booking cancelled',
    ),
  );
};
