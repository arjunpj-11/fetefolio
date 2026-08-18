import { z } from 'zod';
export {
  blockServiceDatesSchema,
  createServiceSchema,
  createServiceTypeSchema,
  deleteServiceTypeQuerySchema,
  serviceTypeListQuerySchema,
  updateServiceSchema,
  updateServiceTypeSchema,
  serviceQuerySchema,
} from '@programme/contracts';
export { availabilityQuerySchema } from '@programme/contracts';
export const serviceFilterMetadataQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9-]{1,49}$/),
});
export const serviceIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid service identifier'),
});
export const blockedDateParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid service identifier'),
  blockId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid blocked-date identifier'),
});
export const serviceTypeIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid service type identifier'),
});
