import {
  calculateBookingDays,
  calculateTotalPrice,
} from '../../src/shared/utils/priceCalculator.js';
describe('priceCalculator', () => {
  it('counts booking days inclusively', () =>
    expect(calculateBookingDays(new Date('2026-10-12'), new Date('2026-10-14'))).toBe(3));
  it('calculates the server-authoritative total', () =>
    expect(calculateTotalPrice(new Date('2026-10-12'), new Date('2026-10-14'), 25000)).toEqual({
      totalDays: 3,
      totalPrice: 75000,
    }));
  it('rejects reversed ranges', () =>
    expect(() => calculateBookingDays(new Date('2026-10-15'), new Date('2026-10-14'))).toThrow(
      'Invalid booking date range',
    ));
});
