import { ApiError } from './ApiError.js';

const DAY_MS = 86_400_000;
export const calculateBookingDays = (startDate: Date, endDate: Date): number => {
  const start = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  );
  const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start)
    throw new ApiError(400, 'Invalid booking date range');
  return Math.floor((end - start) / DAY_MS) + 1;
};
export const calculateTotalPrice = (
  startDate: Date,
  endDate: Date,
  pricePerDay: number,
): { totalDays: number; totalPrice: number } => {
  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0)
    throw new ApiError(400, 'Invalid service price');
  const totalDays = calculateBookingDays(startDate, endDate);
  return { totalDays, totalPrice: totalDays * pricePerDay };
};
