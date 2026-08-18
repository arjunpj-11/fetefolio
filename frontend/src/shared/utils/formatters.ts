import { differenceInCalendarDays, format } from 'date-fns';
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
export const formatDate = (value: string | Date, pattern = 'dd MMM yyyy'): string =>
  format(new Date(value), pattern).toUpperCase();
export const getServiceTitle = (service: string | { title: string }): string =>
  typeof service === 'string' ? 'Service' : service.title;

export const getBookingDateKey = (value: string): string => {
  const date = new Date(value);
  const isCanonicalBoundary =
    (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) ||
    (date.getUTCHours() === 23 && date.getUTCMinutes() === 59);
  return isCanonicalBoundary ? date.toISOString().slice(0, 10) : format(date, 'yyyy-MM-dd');
};

export const formatBookingDate = (value: string, pattern = 'dd MMM yyyy'): string =>
  format(new Date(`${getBookingDateKey(value)}T00:00:00`), pattern).toUpperCase();

export const getInclusiveBookingPricing = (booking: {
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
}): { totalDays: number; totalPrice: number } => {
  const startDate = new Date(`${getBookingDateKey(booking.startDate)}T00:00:00`);
  const endDate = new Date(`${getBookingDateKey(booking.endDate)}T00:00:00`);
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
  if (!Number.isFinite(totalDays) || totalDays < 1 || totalDays === booking.totalDays)
    return { totalDays: booking.totalDays, totalPrice: booking.totalPrice };
  const bookedDailyRate = booking.totalDays > 0 ? booking.totalPrice / booking.totalDays : 0;
  return {
    totalDays,
    totalPrice:
      Number.isFinite(bookedDailyRate) && bookedDailyRate > 0
        ? Math.round(bookedDailyRate * totalDays)
        : booking.totalPrice,
  };
};
