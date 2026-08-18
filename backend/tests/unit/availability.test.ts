import { dateRangesOverlap } from '../../src/modules/bookings/booking.service.js';
describe('booking availability', () => {
  it('treats touching inclusive ranges as a conflict', () =>
    expect(
      dateRangesOverlap(
        new Date('2026-10-12'),
        new Date('2026-10-14'),
        new Date('2026-10-14'),
        new Date('2026-10-16'),
      ),
    ).toBe(true));
  it('allows separated date ranges', () =>
    expect(
      dateRangesOverlap(
        new Date('2026-10-12'),
        new Date('2026-10-14'),
        new Date('2026-10-15'),
        new Date('2026-10-16'),
      ),
    ).toBe(false));
});
