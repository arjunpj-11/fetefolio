import type {
  CreateServiceTypeDTO,
  DeleteServiceTypeQueryDTO,
  ServiceTypeListQueryDTO,
  UpdateServiceTypeDTO,
} from '@programme/contracts';
import type { Request, Response } from 'express';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import {
  createServiceType,
  deleteServiceType,
  listServiceTypes,
  updateServiceType,
} from './service-type.service.js';

interface IdParams {
  id: string;
}

export const listServiceTypesController = async (
  req: Request<object, object, object, ServiceTypeListQueryDTO>,
  res: Response,
): Promise<void> => {
  res.json(new ApiResponse(await listServiceTypes(req.query), 'Service types loaded'));
};

export const createServiceTypeController = async (
  req: Request<object, object, CreateServiceTypeDTO>,
  res: Response,
): Promise<void> => {
  res.status(201).json(new ApiResponse(await createServiceType(req.body), 'Service type created'));
};

export const updateServiceTypeController = async (
  req: Request<IdParams, object, UpdateServiceTypeDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(await updateServiceType(req.params.id, req.body), 'Service type updated'),
  );
};

export const deleteServiceTypeController = async (
  req: Request<IdParams, object, object, DeleteServiceTypeQueryDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(
      await deleteServiceType(req.params.id, req.query.cascade),
      'Service type deleted',
    ),
  );
};
