import type {
  AvailabilityQueryDTO,
  BookingScope,
  IAdminBookingGrouping,
  IBooking,
  IPaginatedBookings,
  IUnavailableRange,
} from '@programme/contracts';
import { Types, type FilterQuery, type HydratedDocument, type SortOrder } from 'mongoose';
import {
  sendBookingCancellation,
  sendBookingConfirmation,
  sendBookingRejection,
} from '../../shared/config/mailer.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { calculateBookingDays, calculateTotalPrice } from '../../shared/utils/priceCalculator.js';
import { getServiceDocument } from '../services/service.service.js';
import type { IServiceDocument } from '../services/service.types.js';
import { BookingModel } from './booking.model.js';
import type {
  BookingListQueryDTO,
  CancelBookingDTO,
  ConfirmBookingDTO,
  CreateBookingDTO,
  IBookingDocument,
  RejectBookingDTO,
} from './booking.types.js';

export const dateRangesOverlap = (
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean => firstStart <= secondEnd && firstEnd >= secondStart;
const hasManualConflict = (
  service: HydratedDocument<IServiceDocument>,
  startDate: Date,
  endDate: Date,
): boolean =>
  (service.blockedDateRanges ?? []).some(
    (range) => range.startDate <= endDate && range.endDate >= startDate,
  );

const normalizedPricing = (
  booking: HydratedDocument<IBookingDocument>,
): { totalDays: number; totalPrice: number } => {
  const totalDays = calculateBookingDays(booking.startDate, booking.endDate);
  if (totalDays === booking.totalDays) return { totalDays, totalPrice: booking.totalPrice };

  const bookedDailyRate = booking.totalDays > 0 ? booking.totalPrice / booking.totalDays : 0;
  return {
    totalDays,
    totalPrice:
      Number.isFinite(bookedDailyRate) && bookedDailyRate > 0
        ? Math.round(bookedDailyRate * totalDays)
        : booking.totalPrice,
  };
};

const toBooking = (
  booking: HydratedDocument<IBookingDocument>,
  service?: HydratedDocument<IServiceDocument>,
  includeAdminContact = false,
): IBooking => {
  const pricing = normalizedPricing(booking);
  return {
    id: booking._id.toString(),
    user: booking.user.toString(),
    service: service
      ? {
          id: service._id.toString(),
          title: service.title,
          category: service.category,
          pricePerDay: service.pricePerDay,
          contactDetails: {
            phone: service.contactDetails.phone,
            email: service.contactDetails.email,
          },
          ...(includeAdminContact && service.adminContactPhone
            ? { adminContactPhone: service.adminContactPhone }
            : {}),
        }
      : booking.service.toString(),
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    totalDays: pricing.totalDays,
    totalPrice: pricing.totalPrice,
    ...(booking.contactDetails?.name
      ? {
          contactDetails: {
            name: booking.contactDetails.name,
            phone: booking.contactDetails.phone,
            email: booking.contactDetails.email,
            ...(booking.contactDetails.note ? { note: booking.contactDetails.note } : {}),
          },
        }
      : {}),
    status: booking.status,
    ...(booking.rejectionReason ? { rejectionReason: booking.rejectionReason } : {}),
    ...(booking.cancellationReason ? { cancellationReason: booking.cancellationReason } : {}),
    createdAt: booking.createdAt.toISOString(),
  };
};

const sortMap: Record<BookingListQueryDTO['sort'], Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  startAsc: { startDate: 1 },
};

export const createBooking = async (
  dto: CreateBookingDTO,
  user: { id: string; name: string; email: string },
): Promise<IBooking> => {
  const startDate = new Date(`${dto.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${dto.endDate}T23:59:59.999Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (startDate < today) throw new ApiError(400, 'Bookings cannot start in the past');
  const service = await getServiceDocument(dto.serviceId);
  if (!service.isActive) throw new ApiError(404, 'Service is not available');
  if (hasManualConflict(service, startDate, endDate))
    throw new ApiError(409, 'This service is unavailable for the selected dates');
  const { totalDays, totalPrice } = calculateTotalPrice(startDate, endDate, service.pricePerDay);
  const booking = await BookingModel.create({
    user: user.id,
    service: service._id,
    startDate,
    endDate,
    totalDays,
    totalPrice,
    contactDetails: dto.contactDetails,
    status: 'pending',
  });
  return toBooking(booking, service);
};

const getManagedBooking = async (
  id: string,
  providerId: string,
): Promise<{
  booking: HydratedDocument<IBookingDocument>;
  service: HydratedDocument<IServiceDocument>;
}> => {
  const booking = await BookingModel.findById(id);
  if (!booking) throw new ApiError(404, 'Booking request not found');
  const service = await getServiceDocument(booking.service.toString());
  if (service.provider.toString() !== providerId)
    throw new ApiError(403, 'You can only manage requests for your own services');
  return { booking, service };
};

export const confirmBooking = async (
  id: string,
  providerId: string,
  dto: ConfirmBookingDTO = {},
): Promise<IBooking> => {
  const { booking, service } = await getManagedBooking(id, providerId);
  if (booking.status !== 'pending')
    throw new ApiError(409, 'Only pending booking requests can be confirmed');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (booking.startDate < today)
    throw new ApiError(
      409,
      'This booking request can no longer be confirmed because its start date has passed',
    );
  if (dto.blockDates) {
    const blockStart = new Date(`${dto.blockDates.startDate}T00:00:00.000Z`);
    const blockEnd = new Date(`${dto.blockDates.endDate}T23:59:59.999Z`);
    if (blockStart < booking.startDate || blockEnd > booking.endDate)
      throw new ApiError(400, 'Blocked dates must stay within the customer’s requested dates');
    if (hasManualConflict(service, blockStart, blockEnd))
      throw new ApiError(409, 'The selected dates overlap an existing unavailable range');
    service.blockedDateRanges ??= [];
    service.blockedDateRanges.push({
      _id: new Types.ObjectId(),
      startDate: blockStart,
      endDate: blockEnd,
    });
  }
  booking.status = 'confirmed';
  await Promise.all([booking.save(), ...(dto.blockDates ? [service.save()] : [])]);
  if (booking.contactDetails)
    void sendBookingConfirmation({
      to: booking.contactDetails.email,
      name: booking.contactDetails.name,
      serviceTitle: service.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      bookingCode: booking._id.toString().slice(-8).toUpperCase(),
    }).catch((error: unknown) => console.error('Booking confirmation email failed', error));
  return toBooking(booking, service, true);
};

export const rejectBooking = async (
  id: string,
  providerId: string,
  dto: RejectBookingDTO,
): Promise<IBooking> => {
  const { booking, service } = await getManagedBooking(id, providerId);
  if (booking.status !== 'pending')
    throw new ApiError(409, 'Only pending booking requests can be rejected');
  booking.status = 'rejected';
  booking.rejectionReason = dto.reason.trim();
  await booking.save();
  if (booking.contactDetails)
    void sendBookingRejection({
      to: booking.contactDetails.email,
      name: booking.contactDetails.name,
      serviceTitle: service.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      bookingCode: booking._id.toString().slice(-8).toUpperCase(),
      reason: booking.rejectionReason,
    }).catch((error: unknown) => console.error('Booking rejection email failed', error));
  return toBooking(booking, service, true);
};

export const cancelBooking = async (
  id: string,
  providerId: string,
  dto: CancelBookingDTO,
): Promise<IBooking> => {
  const { booking, service } = await getManagedBooking(id, providerId);
  if (booking.status !== 'confirmed')
    throw new ApiError(409, 'Only confirmed bookings can be cancelled');
  booking.status = 'cancelled';
  booking.cancellationReason = dto.reason.trim();
  await booking.save();
  if (booking.contactDetails)
    void sendBookingCancellation({
      to: booking.contactDetails.email,
      name: booking.contactDetails.name,
      serviceTitle: service.title,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalPrice: booking.totalPrice,
      bookingCode: booking._id.toString().slice(-8).toUpperCase(),
      reason: booking.cancellationReason,
    }).catch((error: unknown) => console.error('Booking cancellation email failed', error));
  return toBooking(booking, service, true);
};

const todayUtc = (): Date => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};
const scopeFilter = (scope: BookingScope, today = todayUtc()): FilterQuery<IBookingDocument> => {
  if (scope === 'pending') return { status: 'pending' };
  if (scope === 'confirmed') return { status: { $in: ['confirmed', 'completed'] } };
  if (scope === 'upcoming') return { status: 'confirmed', endDate: { $gte: today } };
  if (scope === 'past')
    return { status: { $in: ['confirmed', 'completed'] }, endDate: { $lt: today } };
  return {};
};
const matchesScope = (
  booking: HydratedDocument<IBookingDocument>,
  scope: BookingScope,
  today: Date,
): boolean => {
  if (scope === 'pending') return booking.status === 'pending';
  if (scope === 'confirmed')
    return booking.status === 'confirmed' || booking.status === 'completed';
  if (scope === 'upcoming') return booking.status === 'confirmed' && booking.endDate >= today;
  if (scope === 'past')
    return (
      (booking.status === 'confirmed' || booking.status === 'completed') && booking.endDate < today
    );
  return true;
};

const loadBookingPage = async (
  filter: FilterQuery<IBookingDocument>,
  query: BookingListQueryDTO,
  includeAdminContact = false,
): Promise<IPaginatedBookings> => {
  const scopedFilter = { ...filter, ...scopeFilter(query.scope) };
  const [bookings, totalCount] = await Promise.all([
    BookingModel.find(scopedFilter)
      .sort(sortMap[query.sort])
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    BookingModel.countDocuments(scopedFilter),
  ]);
  const serviceIds = bookings.map((booking) => booking.service);
  const services = await (
    await import('../services/service.model.js')
  ).ServiceModel.find({ _id: { $in: serviceIds } });
  const byId = new Map(services.map((service) => [service._id.toString(), service]));
  return {
    bookings: bookings.map((booking) =>
      toBooking(booking, byId.get(booking.service.toString()), includeAdminContact),
    ),
    currentPage: query.page,
    totalPages: Math.ceil(totalCount / query.limit),
    totalCount,
  };
};

export const listUserBookings = (
  userId: string,
  query: BookingListQueryDTO,
): Promise<IPaginatedBookings> => loadBookingPage({ user: userId }, query);

export const listServiceBookings = async (
  serviceId: string,
  providerId: string,
  query: BookingListQueryDTO,
): Promise<IPaginatedBookings> => {
  const service = await getServiceDocument(serviceId);
  if (service.provider.toString() !== providerId)
    throw new ApiError(403, 'You can only view bookings for your own services');
  return loadBookingPage({ service: serviceId }, query, true);
};

export const listProviderBookings = async (
  providerId: string,
  query: BookingListQueryDTO,
): Promise<IPaginatedBookings> => {
  const { ServiceModel } = await import('../services/service.model.js');
  const serviceIds: Types.ObjectId[] = await ServiceModel.find({ provider: providerId }).distinct(
    '_id',
  );
  return loadBookingPage({ service: { $in: serviceIds } }, query, true);
};

export const listProviderBookingGroups = async (
  providerId: string,
  scope: BookingScope,
): Promise<IAdminBookingGrouping> => {
  const { ServiceModel } = await import('../services/service.model.js');
  const services = await ServiceModel.find({ provider: providerId });
  const byId = new Map(services.map((service) => [service._id.toString(), service]));
  const bookings = await BookingModel.find({
    service: { $in: services.map((service) => service._id) },
  });
  const today = todayUtc();
  const counts = {
    all: bookings.length,
    pending: bookings.filter((booking) => matchesScope(booking, 'pending', today)).length,
    upcoming: bookings.filter((booking) => matchesScope(booking, 'upcoming', today)).length,
    past: bookings.filter((booking) => matchesScope(booking, 'past', today)).length,
  };
  const visible = bookings.filter((booking) => matchesScope(booking, scope, today));
  const grouped = new Map<string, typeof visible>();
  visible.forEach((booking) => {
    const key = booking.service.toString();
    grouped.set(key, [...(grouped.get(key) ?? []), booking]);
  });
  const groups = [...grouped.entries()]
    .flatMap(([serviceId, serviceBookings]) => {
      const service = byId.get(serviceId);
      if (!service) return [];
      const upcoming = serviceBookings.filter((booking) =>
        matchesScope(booking, 'upcoming', today),
      );
      const past = serviceBookings.filter((booking) => matchesScope(booking, 'past', today));
      const pending = serviceBookings.filter((booking) => matchesScope(booking, 'pending', today));
      const nextStart = [...upcoming, ...pending].sort(
        (left, right) => left.startDate.getTime() - right.startDate.getTime(),
      )[0]?.startDate;
      return [
        {
          service: {
            id: service._id.toString(),
            title: service.title,
            category: service.category,
            pricePerDay: service.pricePerDay,
            contactDetails: service.contactDetails,
            ...(service.adminContactPhone ? { adminContactPhone: service.adminContactPhone } : {}),
          },
          bookingCount: serviceBookings.length,
          pendingCount: pending.length,
          upcomingCount: upcoming.length,
          pastCount: past.length,
          totalValue: serviceBookings
            .filter((booking) => booking.status === 'confirmed' || booking.status === 'completed')
            .reduce((total, booking) => total + normalizedPricing(booking).totalPrice, 0),
          ...(nextStart ? { nextStartDate: nextStart.toISOString() } : {}),
        },
      ];
    })
    .sort(
      (left, right) =>
        right.bookingCount - left.bookingCount ||
        left.service.title.localeCompare(right.service.title),
    );
  return { counts, groups };
};

export const listUnavailableRanges = async (
  serviceId: string,
  query: AvailabilityQueryDTO,
): Promise<IUnavailableRange[]> => {
  const service = await getServiceDocument(serviceId);
  const from = new Date(`${query.from}T00:00:00.000Z`);
  const to = new Date(`${query.to}T23:59:59.999Z`);
  return (service.blockedDateRanges ?? [])
    .filter((range) => range.startDate <= to && range.endDate >= from)
    .map((range) => ({
      startDate: range.startDate.toISOString().slice(0, 10),
      endDate: range.endDate.toISOString().slice(0, 10),
      source: 'blocked' as const,
    }))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
};
