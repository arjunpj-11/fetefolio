import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { verifyToken } from '../../shared/middlewares/auth.middleware.js';
import { requireAdmin } from '../../shared/middlewares/role.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import {
  blockServiceDatesController,
  cloudinaryUploadSignatureController,
  createServiceController,
  deleteServiceController,
  getServiceController,
  listServicesController,
  serviceAvailabilityController,
  serviceFilterMetadataController,
  unblockServiceDatesController,
  updateServiceController,
} from './service.controller.js';
import {
  createServiceTypeController,
  deleteServiceTypeController,
  listServiceTypesController,
  updateServiceTypeController,
} from './service-type.controller.js';
import {
  availabilityQuerySchema,
  blockedDateParamsSchema,
  blockServiceDatesSchema,
  createServiceSchema,
  createServiceTypeSchema,
  deleteServiceTypeQuerySchema,
  serviceFilterMetadataQuerySchema,
  serviceIdParamsSchema,
  serviceQuerySchema,
  serviceTypeIdParamsSchema,
  serviceTypeListQuerySchema,
  updateServiceSchema,
  updateServiceTypeSchema,
} from './service.validator.js';

export const serviceRouter = Router();
serviceRouter.get('/', validate(serviceQuerySchema, 'query'), asyncHandler(listServicesController));
serviceRouter.get(
  '/types',
  validate(serviceTypeListQuerySchema, 'query'),
  asyncHandler(listServiceTypesController),
);
serviceRouter.post(
  '/types',
  verifyToken,
  requireAdmin,
  validate(createServiceTypeSchema),
  asyncHandler(createServiceTypeController),
);
serviceRouter.put(
  '/types/:id',
  verifyToken,
  requireAdmin,
  validate(serviceTypeIdParamsSchema, 'params'),
  validate(updateServiceTypeSchema),
  asyncHandler(updateServiceTypeController),
);
serviceRouter.delete(
  '/types/:id',
  verifyToken,
  requireAdmin,
  validate(serviceTypeIdParamsSchema, 'params'),
  validate(deleteServiceTypeQuerySchema, 'query'),
  asyncHandler(deleteServiceTypeController),
);
serviceRouter.get(
  '/uploads/cloudinary-signature',
  verifyToken,
  requireAdmin,
  cloudinaryUploadSignatureController,
);
serviceRouter.get(
  '/meta/filters',
  validate(serviceFilterMetadataQuerySchema, 'query'),
  asyncHandler(serviceFilterMetadataController),
);
serviceRouter.get(
  '/:id/availability',
  validate(serviceIdParamsSchema, 'params'),
  validate(availabilityQuerySchema, 'query'),
  asyncHandler(serviceAvailabilityController),
);
serviceRouter.post(
  '/:id/blocked-dates',
  verifyToken,
  requireAdmin,
  validate(serviceIdParamsSchema, 'params'),
  validate(blockServiceDatesSchema),
  asyncHandler(blockServiceDatesController),
);
serviceRouter.delete(
  '/:id/blocked-dates/:blockId',
  verifyToken,
  requireAdmin,
  validate(blockedDateParamsSchema, 'params'),
  asyncHandler(unblockServiceDatesController),
);
serviceRouter.get(
  '/:id',
  validate(serviceIdParamsSchema, 'params'),
  asyncHandler(getServiceController),
);
serviceRouter.post(
  '/',
  verifyToken,
  requireAdmin,
  validate(createServiceSchema),
  asyncHandler(createServiceController),
);
serviceRouter.put(
  '/:id',
  verifyToken,
  requireAdmin,
  validate(serviceIdParamsSchema, 'params'),
  validate(updateServiceSchema),
  asyncHandler(updateServiceController),
);
serviceRouter.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  validate(serviceIdParamsSchema, 'params'),
  asyncHandler(deleteServiceController),
);
