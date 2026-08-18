import type { Request, Response } from 'express';
import type { ServiceCategory } from '@programme/contracts';
import type {
  BlockServiceDatesDTO,
  CreateServiceDTO,
  ServiceQueryDTO,
  UpdateServiceDTO,
} from './service.types.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { createCloudinaryUploadSignature } from '../../shared/config/cloudinary.js';
import { listUnavailableRanges } from '../bookings/booking.service.js';
import {
  blockServiceDates,
  createService,
  deleteService,
  getServiceById,
  getServiceFilterMetadata,
  listServices,
  unblockServiceDates,
  updateService,
} from './service.service.js';

type IdParams = { id: string };
export const listServicesController = async (
  req: Request<object, object, object, ServiceQueryDTO>,
  res: Response,
): Promise<void> => {
  res.json(new ApiResponse(await listServices(req.query), 'Services loaded'));
};
export const getServiceController = async (
  req: Request<IdParams>,
  res: Response,
): Promise<void> => {
  const date =
    typeof req.query.date === 'string' ? new Date(`${req.query.date}T00:00:00.000Z`) : undefined;
  res.json(new ApiResponse(await getServiceById(req.params.id, date), 'Service loaded'));
};
export const createServiceController = async (
  req: Request<object, object, CreateServiceDTO>,
  res: Response,
): Promise<void> => {
  res
    .status(201)
    .json(
      new ApiResponse(await createService(req.body, req.user._id.toString()), 'Service created'),
    );
};
export const updateServiceController = async (
  req: Request<IdParams, object, UpdateServiceDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await updateService(req.params.id, req.body, req.user._id.toString()),
      'Service updated',
    ),
  );
};
export const blockServiceDatesController = async (
  req: Request<IdParams, object, BlockServiceDatesDTO>,
  res: Response,
): Promise<void> => {
  res
    .status(201)
    .json(
      new ApiResponse(
        await blockServiceDates(req.params.id, req.body, req.user._id.toString()),
        'Dates marked unavailable',
      ),
    );
};
export const unblockServiceDatesController = async (
  req: Request<IdParams & { blockId: string }>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await unblockServiceDates(req.params.id, req.params.blockId, req.user._id.toString()),
      'Dates available again',
    ),
  );
};
export const deleteServiceController = async (
  req: Request<IdParams>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(await deleteService(req.params.id, req.user._id.toString()), 'Service deleted'),
  );
};
export const serviceFilterMetadataController = async (
  req: Request<object, object, object, { category: ServiceCategory }>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(await getServiceFilterMetadata(req.query.category), 'Service filters loaded'),
  );
};
export const serviceAvailabilityController = async (
  req: Request<IdParams, object, object, { from: string; to: string }>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(await listUnavailableRanges(req.params.id, req.query), 'Availability loaded'),
  );
};
export const cloudinaryUploadSignatureController = (_req: Request, res: Response): void => {
  res.json(new ApiResponse(createCloudinaryUploadSignature(), 'Upload signature created'));
};
