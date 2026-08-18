import type {
  IBlockedDateRange,
  IPaginatedServices,
  IService,
  IServiceFilterMetadata,
  ServiceCategory,
} from '@programme/contracts';
import type { FilterQuery, HydratedDocument, SortOrder } from 'mongoose';
import { Types } from 'mongoose';
import { ApiError } from '../../shared/utils/ApiError.js';
import { BookingModel } from '../bookings/booking.model.js';
import { ServiceModel } from './service.model.js';
import { assertServiceTypeExists } from './service-type.service.js';
import type {
  BlockServiceDatesDTO,
  CreateServiceDTO,
  IServiceDocument,
  ServiceQueryDTO,
  UpdateServiceDTO,
} from './service.types.js';

const toBlockedDateRange = (
  range: IServiceDocument['blockedDateRanges'][number],
): IBlockedDateRange => ({
  id: range._id.toString(),
  startDate: range.startDate.toISOString().slice(0, 10),
  endDate: range.endDate.toISOString().slice(0, 10),
});

const toService = (
  service: HydratedDocument<IServiceDocument>,
  isAvailable?: boolean,
  includeAdminContact = false,
): IService => ({
  id: service._id.toString(),
  title: service.title,
  category: service.category,
  description: service.description,
  pricePerDay: service.pricePerDay,
  location: service.location,
  images: [...service.images],
  contactDetails: service.contactDetails,
  ...(includeAdminContact && service.adminContactPhone
    ? { adminContactPhone: service.adminContactPhone }
    : {}),
  rating: service.rating ?? 4.5,
  ...(service.capacity !== undefined ? { capacity: service.capacity } : {}),
  provider: service.provider.toString(),
  isActive: service.isActive,
  createdAt: service.createdAt.toISOString(),
  blockedDateRanges: (service.blockedDateRanges ?? []).map(toBlockedDateRange),
  ...(isAvailable === undefined ? {} : { isAvailable }),
});

const sortMap: Record<ServiceQueryDTO['sort'], Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  priceAsc: { pricePerDay: 1 },
  priceDesc: { pricePerDay: -1 },
  titleAsc: { title: 1 },
  ratingDesc: { rating: -1, createdAt: -1 },
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const assertUniqueServiceTitle = async (
  title: string,
  excludeId?: string,
): Promise<void> => {
  const duplicate = await ServiceModel.exists({
    title: { $regex: `^${escapeRegex(title.trim())}$`, $options: 'i' },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (duplicate)
    throw new ApiError(
      409,
      `A service named “${title.trim()}” already exists. Service names must be unique.`,
    );
};

export const listServices = async (query: ServiceQueryDTO): Promise<IPaginatedServices> => {
  const filter: FilterQuery<IServiceDocument> = { isActive: true };
  if (query.category) filter.category = query.category;
  if (query.city)
    filter['location.city'] = {
      $regex: query.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      $options: 'i',
    };
  if (query.minPrice !== undefined || query.maxPrice !== undefined)
    filter.pricePerDay = {
      ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
    };
  if (query.minRating !== undefined) filter.rating = { $gte: query.minRating };
  if (query.search) filter.$text = { $search: query.search };

  const checkStart = query.startDate ?? query.date;
  const checkEnd = query.endDate ?? query.date;
  if (checkStart && checkEnd) {
    const startDate = new Date(`${checkStart}T00:00:00.000Z`);
    const endDate = new Date(`${checkEnd}T23:59:59.999Z`);
    const blocked = await ServiceModel.distinct('_id', {
      blockedDateRanges: {
        $elemMatch: { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      },
    });
    filter._id = { $nin: blocked };
  }
  const [services, totalCount] = await Promise.all([
    ServiceModel.find(filter)
      .sort(sortMap[query.sort])
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    ServiceModel.countDocuments(filter),
  ]);
  return {
    services: services.map((service) => toService(service, true)),
    currentPage: query.page,
    totalPages: Math.ceil(totalCount / query.limit),
    totalCount,
  };
};

export const getServiceFilterMetadata = async (
  category: ServiceCategory,
): Promise<IServiceFilterMetadata> => {
  const services = await ServiceModel.find({ category, isActive: true }).select('location.city');
  const cities = [...new Set(services.map((service) => service.location.city))].sort();
  return { category, cities };
};

export const getServiceById = async (id: string, date?: Date): Promise<IService> => {
  const service = await ServiceModel.findById(id);
  if (!service || !service.isActive) throw new ApiError(404, 'Service not found');
  const manuallyBlocked = date
    ? (service.blockedDateRanges ?? []).some(
        (range) => range.startDate <= date && range.endDate >= date,
      )
    : false;
  const isAvailable = date ? !manuallyBlocked : true;
  return toService(service, isAvailable);
};

export const getServiceDocument = async (
  id: string,
): Promise<HydratedDocument<IServiceDocument>> => {
  const service = await ServiceModel.findById(id);
  if (!service) throw new ApiError(404, 'Service not found');
  return service;
};

export const createService = async (
  dto: CreateServiceDTO,
  providerId: string,
): Promise<IService> => {
  await Promise.all([assertServiceTypeExists(dto.category), assertUniqueServiceTitle(dto.title)]);
  try {
    return toService(await ServiceModel.create({ ...dto, provider: providerId }), undefined, true);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)
      throw new ApiError(
        409,
        `A service named “${dto.title.trim()}” already exists. Service names must be unique.`,
      );
    throw error;
  }
};

export const updateService = async (
  id: string,
  dto: UpdateServiceDTO,
  providerId: string,
): Promise<IService> => {
  const service = await getServiceDocument(id);
  if (service.provider.toString() !== providerId)
    throw new ApiError(403, 'You can only modify your own services');
  await Promise.all([
    ...(dto.category ? [assertServiceTypeExists(dto.category)] : []),
    ...(dto.title ? [assertUniqueServiceTitle(dto.title, id)] : []),
  ]);
  Object.assign(service, dto);
  try {
    await service.save();
    return toService(service, undefined, true);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)
      throw new ApiError(
        409,
        `A service named “${(dto.title ?? service.title).trim()}” already exists. Service names must be unique.`,
      );
    throw error;
  }
};

export const blockServiceDates = async (
  id: string,
  dto: BlockServiceDatesDTO,
  providerId: string,
): Promise<IService> => {
  const service = await getServiceDocument(id);
  if (service.provider.toString() !== providerId)
    throw new ApiError(403, 'You can only manage availability for your own services');
  const startDate = new Date(`${dto.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${dto.endDate}T23:59:59.999Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (startDate < today) throw new ApiError(400, 'Unavailable dates cannot start in the past');
  if (
    (service.blockedDateRanges ?? []).some(
      (range) => range.startDate <= endDate && range.endDate >= startDate,
    )
  )
    throw new ApiError(409, 'These dates overlap an existing unavailable range');
  service.blockedDateRanges ??= [];
  service.blockedDateRanges.push({ _id: new Types.ObjectId(), startDate, endDate });
  await service.save();
  return toService(service, undefined, true);
};

export const unblockServiceDates = async (
  id: string,
  blockId: string,
  providerId: string,
): Promise<IService> => {
  const service = await getServiceDocument(id);
  if (service.provider.toString() !== providerId)
    throw new ApiError(403, 'You can only manage availability for your own services');
  const index = (service.blockedDateRanges ?? []).findIndex(
    (range) => range._id.toString() === blockId,
  );
  if (index < 0) throw new ApiError(404, 'Unavailable date range not found');
  service.blockedDateRanges.splice(index, 1);
  await service.save();
  return toService(service, undefined, true);
};

export const deleteService = async (id: string, providerId: string): Promise<{ id: string }> => {
  const service = await getServiceDocument(id);
  if (service.provider.toString() !== providerId)
    throw new ApiError(403, 'You can only delete your own services');
  if (
    await BookingModel.exists({
      service: id,
      status: { $in: ['pending', 'confirmed'] },
      endDate: { $gte: new Date() },
    })
  )
    throw new ApiError(
      409,
      'This service has pending or confirmed upcoming bookings and cannot be deleted',
    );
  await service.deleteOne();
  return { id };
};

export const listProviderServices = async (providerId: string): Promise<IService[]> =>
  (await ServiceModel.find({ provider: providerId }).sort({ createdAt: -1 })).map((service) =>
    toService(service, undefined, true),
  );
