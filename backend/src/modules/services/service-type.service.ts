import type {
  CreateServiceTypeDTO,
  IDeleteServiceTypeResult,
  IServiceType,
  ServiceTypeListQueryDTO,
  UpdateServiceTypeDTO,
} from '@programme/contracts';
import type { HydratedDocument } from 'mongoose';
import { ApiError } from '../../shared/utils/ApiError.js';
import { BookingModel } from '../bookings/booking.model.js';
import { ServiceTypeModel, type IServiceTypeDocument } from './service-type.model.js';
import { ServiceModel } from './service.model.js';

const normalizeName = (value: string): string =>
  value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
const toSlug = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
const toSingular = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.toLocaleLowerCase().endsWith('s') ? trimmed.slice(0, -1) : trimmed;
};
const toServiceType = (
  type: HydratedDocument<IServiceTypeDocument>,
  serviceCount = 0,
): IServiceType => ({
  id: type._id.toString(),
  slug: type.slug,
  label: type.label,
  singular: type.singular,
  description: type.description,
  ...(type.capacityLabel ? { capacityLabel: type.capacityLabel } : {}),
  dateLabel: type.dateLabel,
  icon: type.icon ?? 'sparkles',
  createdAt: type.createdAt.toISOString(),
  serviceCount,
});

export const listServiceTypes = async (
  query: ServiceTypeListQueryDTO = { availableOnly: false },
): Promise<IServiceType[]> => {
  const [types, counts] = await Promise.all([
    ServiceTypeModel.find().sort({ label: 1 }),
    ServiceModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);
  const countBySlug = new Map(counts.map((entry) => [entry._id, entry.count]));
  let availableSlugs: Set<string> | undefined;
  if (query.availableOnly) {
    const startKey = query.startDate ?? new Date().toISOString().slice(0, 10);
    const endKey = query.endDate ?? startKey;
    const startDate = new Date(`${startKey}T00:00:00.000Z`);
    const endDate = new Date(`${endKey}T23:59:59.999Z`);
    const blocked = await ServiceModel.distinct('_id', {
      blockedDateRanges: {
        $elemMatch: { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      },
    });
    availableSlugs = new Set(
      await ServiceModel.distinct('category', { isActive: true, _id: { $nin: blocked } }),
    );
  }
  return types
    .filter((type) => !availableSlugs || availableSlugs.has(type.slug))
    .map((type) => toServiceType(type, countBySlug.get(type.slug) ?? 0));
};

export const createServiceType = async (dto: CreateServiceTypeDTO): Promise<IServiceType> => {
  const label = dto.name.trim().replace(/\s+/g, ' ');
  const normalizedName = normalizeName(label);
  const slug = toSlug(label);
  if (slug.length < 2)
    throw new ApiError(400, 'Enter a service type name using letters or numbers');
  if (await ServiceTypeModel.exists({ $or: [{ normalizedName }, { slug }] })) {
    throw new ApiError(
      409,
      `The service type “${label}” already exists. Select it from the list instead.`,
    );
  }
  try {
    return toServiceType(
      await ServiceTypeModel.create({
        slug,
        label,
        normalizedName,
        singular: toSingular(label),
        description: `${label} available for events and celebrations`,
        capacityLabel: 'Guest capacity',
        dateLabel: 'Event dates',
        icon: 'sparkles',
      }),
    );
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new ApiError(
        409,
        `The service type “${label}” already exists. Select it from the list instead.`,
      );
    }
    throw error;
  }
};

export const updateServiceType = async (
  id: string,
  dto: UpdateServiceTypeDTO,
): Promise<IServiceType> => {
  const type = await ServiceTypeModel.findById(id);
  if (!type) throw new ApiError(404, 'Service type not found');
  const label = dto.name?.trim().replace(/\s+/g, ' ');
  if (label) {
    const normalizedName = normalizeName(label);
    if (await ServiceTypeModel.exists({ _id: { $ne: type._id }, normalizedName })) {
      throw new ApiError(
        409,
        `The service type “${label}” already exists. Choose a different name.`,
      );
    }
    const generatedDescription = `${type.label} available for events and celebrations`;
    type.label = label;
    type.normalizedName = normalizedName;
    type.singular = toSingular(label);
    if (type.description === generatedDescription)
      type.description = `${label} available for events and celebrations`;
  }
  if (dto.icon) type.icon = dto.icon;
  try {
    await type.save();
    return toServiceType(type, await ServiceModel.countDocuments({ category: type.slug }));
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)
      throw new ApiError(
        409,
        `The service type “${label ?? type.label}” already exists. Choose a different name.`,
      );
    throw error;
  }
};

export const deleteServiceType = async (
  id: string,
  cascade: boolean,
): Promise<IDeleteServiceTypeResult> => {
  const type = await ServiceTypeModel.findById(id);
  if (!type) throw new ApiError(404, 'Service type not found');
  const serviceIds = await ServiceModel.find({ category: type.slug }).distinct('_id');
  if (serviceIds.length > 0 && !cascade) {
    throw new ApiError(
      409,
      `This service type contains ${serviceIds.length} service${serviceIds.length === 1 ? '' : 's'}. Confirm removal to delete them too.`,
    );
  }
  if (
    serviceIds.length > 0 &&
    (await BookingModel.exists({
      service: { $in: serviceIds },
      status: { $in: ['pending', 'confirmed'] },
      endDate: { $gte: new Date() },
    }))
  ) {
    throw new ApiError(
      409,
      'This service type cannot be removed because one or more of its services have pending or confirmed upcoming bookings. Resolve those requests first.',
    );
  }
  const deletedBookings = serviceIds.length
    ? (await BookingModel.deleteMany({ service: { $in: serviceIds } })).deletedCount
    : 0;
  const deletedServices = serviceIds.length
    ? (await ServiceModel.deleteMany({ _id: { $in: serviceIds } })).deletedCount
    : 0;
  await type.deleteOne();
  return { id, deletedServices, deletedBookings };
};

export const assertServiceTypeExists = async (slug: string): Promise<void> => {
  if (!(await ServiceTypeModel.exists({ slug })))
    throw new ApiError(400, 'Select an existing service type or create it first');
};
