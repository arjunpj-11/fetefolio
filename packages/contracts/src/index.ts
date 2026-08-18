import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80, 'Keep your name under 80 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Keep your password under 72 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password').max(72, 'Password is too long'),
});
export const registrationOtpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit verification code');
export const verifyRegistrationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  otp: registrationOtpSchema,
});
export const resendRegistrationOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const serviceCategorySchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9-]{1,49}$/, 'Select a valid service type');
export const serviceTypeIconNames = [
  'sparkles',
  'venue',
  'stay',
  'catering',
  'photography',
  'music',
  'decor',
  'flowers',
  'cake',
  'transport',
  'tent',
  'entertainment',
  'lighting',
  'beauty',
] as const;
export const serviceTypeIconSchema = z.enum(serviceTypeIconNames);
export const locationSchema = z.object({
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(240),
});
export const contactDetailsSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/),
  email: z.string().trim().toLowerCase().email(),
});
export const createServiceSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: serviceCategorySchema,
  description: z.string().trim().min(20).max(3000),
  pricePerDay: z.coerce.number().positive().max(10_000_000),
  location: locationSchema,
  images: z.array(z.string().url()).max(8).default([]),
  contactDetails: contactDetailsSchema,
  adminContactPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid admin contact number'),
  rating: z.coerce.number().min(1).max(5).default(4.5),
  capacity: z.coerce.number().min(1).optional(),
  isActive: z.boolean().default(true),
});
export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');
export const createServiceTypeSchema = z.object({
  name: z.string().trim().min(2, 'Enter a service type name').max(60),
});
export const updateServiceTypeSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter a service type name').max(60).optional(),
    icon: serviceTypeIconSchema.optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.icon !== undefined,
    'Change the name or symbol',
  );
export const serviceTypeListQuerySchema = z
  .object({
    availableOnly: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .default('false'),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
  })
  .refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, {
    path: ['endDate'],
    message: 'End date must be on or after start date',
  });
export const deleteServiceTypeQuerySchema = z.object({
  cascade: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('false'),
});
export const serviceQuerySchema = z
  .object({
    category: serviceCategorySchema.optional(),
    city: z.string().trim().max(80).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    date: z.string().date().optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    sort: z.enum(['newest', 'priceAsc', 'priceDesc', 'titleAsc', 'ratingDesc']).default('newest'),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'Minimum price cannot exceed maximum price',
  });
export const availabilityQuerySchema = z
  .object({ from: z.string().date(), to: z.string().date() })
  .refine((value) => value.from <= value.to, {
    path: ['to'],
    message: 'End date must be on or after start date',
  });
export const blockServiceDatesSchema = z
  .object({ startDate: z.string().date(), endDate: z.string().date() })
  .refine((value) => value.startDate <= value.endDate, {
    path: ['endDate'],
    message: 'End date must be on or after start date',
  });

export const bookingContactDetailsSchema = z.object({
  name: z.string().trim().min(2, 'Enter the contact person’s name').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  note: z.string().trim().max(500, 'Keep booking notes under 500 characters').optional(),
});
export const createBookingSchema = z
  .object({
    serviceId: objectIdSchema,
    startDate: z.string().date(),
    endDate: z.string().date(),
    contactDetails: bookingContactDetailsSchema,
  })
  .refine((value) => new Date(value.startDate) <= new Date(value.endDate), {
    path: ['endDate'],
    message: 'End date must be on or after start date',
  });
export const rejectBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Enter a clear rejection reason')
    .max(500, 'Keep the rejection reason under 500 characters'),
});
export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Enter a clear cancellation reason')
    .max(500, 'Keep the cancellation reason under 500 characters'),
});
export const confirmBookingSchema = z
  .object({ blockDates: blockServiceDatesSchema.optional() })
  .default({});
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['newest', 'oldest', 'startAsc']).default('newest'),
});
export const bookingScopeSchema = z
  .enum(['all', 'pending', 'confirmed', 'upcoming', 'past'])
  .default('all');
export const bookingListQuerySchema = paginationQuerySchema.extend({ scope: bookingScopeSchema });

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type VerifyRegistrationDTO = z.infer<typeof verifyRegistrationSchema>;
export type ResendRegistrationOtpDTO = z.infer<typeof resendRegistrationOtpSchema>;
export type CreateServiceDTO = z.infer<typeof createServiceSchema>;
export type UpdateServiceDTO = z.infer<typeof updateServiceSchema>;
export type CreateServiceTypeDTO = z.infer<typeof createServiceTypeSchema>;
export type UpdateServiceTypeDTO = z.infer<typeof updateServiceTypeSchema>;
export type ServiceTypeListQueryDTO = z.infer<typeof serviceTypeListQuerySchema>;
export type DeleteServiceTypeQueryDTO = z.infer<typeof deleteServiceTypeQuerySchema>;
export type ServiceQueryDTO = z.infer<typeof serviceQuerySchema>;
export type CreateBookingDTO = z.infer<typeof createBookingSchema>;
export type ConfirmBookingDTO = z.infer<typeof confirmBookingSchema>;
export type RejectBookingDTO = z.infer<typeof rejectBookingSchema>;
export type CancelBookingDTO = z.infer<typeof cancelBookingSchema>;
export type PaginationQueryDTO = z.infer<typeof paginationQuerySchema>;
export type BookingScope = z.infer<typeof bookingScopeSchema>;
export type BookingListQueryDTO = z.infer<typeof bookingListQuerySchema>;
export type ServiceCategory = z.infer<typeof serviceCategorySchema>;
export type ServiceTypeIconName = z.infer<typeof serviceTypeIconSchema>;
export type AvailabilityQueryDTO = z.infer<typeof availabilityQuerySchema>;
export type BlockServiceDatesDTO = z.infer<typeof blockServiceDatesSchema>;
export type BookingContactDetails = z.infer<typeof bookingContactDetailsSchema>;

export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
export interface IUserPublic {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}
export interface IAuthPayload {
  user: IUserPublic;
  token: string;
}
export interface IRegistrationPending {
  email: string;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}
export interface IBlockedDateRange {
  id: string;
  startDate: string;
  endDate: string;
}
export interface IService {
  id: string;
  title: string;
  category: ServiceCategory;
  description: string;
  pricePerDay: number;
  location: z.infer<typeof locationSchema>;
  images: string[];
  contactDetails: z.infer<typeof contactDetailsSchema>;
  adminContactPhone?: string;
  rating?: number;
  capacity?: number;
  provider: string | Pick<IUserPublic, 'id' | 'name' | 'email'>;
  isActive: boolean;
  createdAt: string;
  isAvailable?: boolean;
  blockedDateRanges?: IBlockedDateRange[];
}
export interface IServiceType {
  id: string;
  slug: ServiceCategory;
  label: string;
  singular: string;
  description: string;
  capacityLabel?: string;
  dateLabel: string;
  icon?: ServiceTypeIconName;
  createdAt: string;
  serviceCount?: number;
}
export interface IDeleteServiceTypeResult {
  id: string;
  deletedServices: number;
  deletedBookings: number;
}
export interface ICloudinaryUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
}
export interface IBooking {
  id: string;
  user: string | Pick<IUserPublic, 'id' | 'name' | 'email'>;
  service:
    | string
    | Pick<
        IService,
        'id' | 'title' | 'category' | 'pricePerDay' | 'contactDetails' | 'adminContactPhone'
      >;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  contactDetails?: BookingContactDetails;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
}
export interface IPaginatedServices {
  services: IService[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
export interface IPaginatedBookings {
  bookings: IBooking[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}
export interface IAdminBookingServiceGroup {
  service: Pick<
    IService,
    'id' | 'title' | 'category' | 'pricePerDay' | 'contactDetails' | 'adminContactPhone'
  >;
  bookingCount: number;
  pendingCount: number;
  upcomingCount: number;
  pastCount: number;
  totalValue: number;
  nextStartDate?: string;
}
export interface IAdminBookingGrouping {
  counts: { all: number; pending: number; upcoming: number; past: number };
  groups: IAdminBookingServiceGroup[];
}
export interface IServiceFilterMetadata {
  category: ServiceCategory;
  cities: string[];
}
export interface IUnavailableRange {
  startDate: string;
  endDate: string;
  source?: 'booking' | 'blocked';
}
