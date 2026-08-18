import { blockServiceDatesSchema } from '../../src/modules/services/service.validator.js';
import {
  bookingListQuerySchema,
  cancelBookingSchema,
  confirmBookingSchema,
  createBookingSchema,
  rejectBookingSchema,
} from '../../src/modules/bookings/booking.validator.js';

const validBooking = {
  serviceId: '507f1f77bcf86cd799439011',
  startDate: '2026-10-12',
  endDate: '2026-10-14',
  contactDetails: {
    name: 'Anika Sharma',
    phone: '+91 98765 43210',
    email: 'anika@example.com',
    note: 'Call after 5 PM.',
  },
};

describe('booking contact validation', () => {
  it('accepts contact details that providers can use', () => {
    expect(createBookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it('requires a valid name, phone number and email address', () => {
    const result = createBookingSchema.safeParse({
      ...validBooking,
      contactDetails: { name: '', phone: '123', email: 'not-an-email' },
    });
    expect(result.success).toBe(false);
  });

  it('requires a clear reason when an admin rejects a request', () => {
    expect(
      rejectBookingSchema.safeParse({ reason: 'Dates are unavailable because of maintenance.' })
        .success,
    ).toBe(true);
    expect(rejectBookingSchema.safeParse({ reason: 'No' }).success).toBe(false);
  });

  it('requires a clear reason when an admin cancels a confirmed booking', () => {
    expect(
      cancelBookingSchema.safeParse({ reason: 'Provider closed for emergency repairs.' }).success,
    ).toBe(true);
    expect(cancelBookingSchema.safeParse({ reason: 'No' }).success).toBe(false);
  });

  it('requires an unavailable range to end on or after it starts', () => {
    expect(
      blockServiceDatesSchema.safeParse({ startDate: '2026-12-10', endDate: '2026-12-12' }).success,
    ).toBe(true);
    expect(
      blockServiceDatesSchema.safeParse({ startDate: '2026-12-12', endDate: '2026-12-10' }).success,
    ).toBe(false);
  });

  it('allows confirmation to keep dates open or block a selected range', () => {
    expect(confirmBookingSchema.safeParse({}).success).toBe(true);
    expect(
      confirmBookingSchema.safeParse({
        blockDates: { startDate: '2026-12-10', endDate: '2026-12-12' },
      }).success,
    ).toBe(true);
    expect(
      confirmBookingSchema.safeParse({
        blockDates: { startDate: '2026-12-12', endDate: '2026-12-10' },
      }).success,
    ).toBe(false);
  });

  it('accepts the admin booking workspace scopes', () => {
    expect(bookingListQuerySchema.parse({ scope: 'pending' })).toMatchObject({
      scope: 'pending',
      page: 1,
      limit: 20,
      sort: 'newest',
    });
    expect(bookingListQuerySchema.safeParse({ scope: 'upcoming' }).success).toBe(true);
    expect(bookingListQuerySchema.safeParse({ scope: 'past' }).success).toBe(true);
    expect(bookingListQuerySchema.safeParse({ scope: 'unknown' }).success).toBe(false);
  });
});
