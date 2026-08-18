import { describe, expect, it } from 'vitest';
import { getInclusiveBookingPricing } from './formatters';

describe('getInclusiveBookingPricing', () => {
  it('keeps a consistent booking total unchanged', () => {
    expect(
      getInclusiveBookingPricing({
        startDate: '2026-12-10T00:00:00.000Z',
        endDate: '2026-12-11T23:59:59.999Z',
        totalDays: 2,
        totalPrice: 20_000,
      }),
    ).toEqual({ totalDays: 2, totalPrice: 20_000 });
  });

  it('repairs legacy totals using the original booked daily rate', () => {
    expect(
      getInclusiveBookingPricing({
        startDate: '2026-12-10T00:00:00.000Z',
        endDate: '2026-12-12T23:59:59.999Z',
        totalDays: 2,
        totalPrice: 20_000,
      }),
    ).toEqual({ totalDays: 3, totalPrice: 30_000 });
  });

  it('counts the local calendar dates shown for legacy timezone-based records', () => {
    expect(
      getInclusiveBookingPricing({
        startDate: '2026-08-24T18:30:00.000Z',
        endDate: '2026-08-28T18:30:00.000Z',
        totalDays: 4,
        totalPrice: 40_000,
      }),
    ).toEqual({ totalDays: 5, totalPrice: 50_000 });
  });
});
