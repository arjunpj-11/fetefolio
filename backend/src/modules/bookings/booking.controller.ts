import type { Request, Response } from 'express';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { createBooking, listServiceBookings, listUserBookings } from './booking.service.js';
import type { BookingListQueryDTO, CreateBookingDTO } from './booking.types.js';

export const createBookingController = async (
  req: Request<object, object, CreateBookingDTO>,
  res: Response,
): Promise<void> => {
  const user = { id: req.user._id.toString(), name: req.user.name, email: req.user.email };
  res
    .status(201)
    .json(
      new ApiResponse(await createBooking(req.body, user), 'Booking request sent for approval'),
    );
};
export const myBookingsController = async (
  req: Request<object, object, object, BookingListQueryDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(await listUserBookings(req.user._id.toString(), req.query), 'Bookings loaded'),
  );
};
export const serviceBookingsController = async (
  req: Request<{ id: string }, object, object, BookingListQueryDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await listServiceBookings(req.params.id, req.user._id.toString(), req.query),
      'Service bookings loaded',
    ),
  );
};
