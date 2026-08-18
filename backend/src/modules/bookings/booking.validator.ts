import { z } from 'zod';
export {
  bookingListQuerySchema,
  cancelBookingSchema,
  confirmBookingSchema,
  createBookingSchema,
  rejectBookingSchema,
} from '@programme/contracts';
export const serviceBookingParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid service identifier'),
});
export const bookingIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid booking identifier'),
});
