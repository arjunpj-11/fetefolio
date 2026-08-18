import type {
  BlockServiceDatesDTO,
  BookingScope,
  CancelBookingDTO,
  ConfirmBookingDTO,
  CreateServiceDTO,
  CreateServiceTypeDTO,
  IAdminBookingGrouping,
  IApiResponse,
  IBooking,
  ICloudinaryUploadSignature,
  IDeleteServiceTypeResult,
  IPaginatedBookings,
  IService,
  IServiceType,
  RejectBookingDTO,
  UpdateServiceDTO,
  UpdateServiceTypeDTO,
} from '@programme/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '../../../shared/api/axiosClient';
const adminKeys = {
  services: ['admin', 'services'] as const,
  bookingsRoot: ['admin', 'bookings'] as const,
  bookings: (page: number, scope: BookingScope, sort: string) =>
    ['admin', 'bookings', scope, sort, page] as const,
  bookingGroups: (scope: BookingScope) => ['admin', 'bookings', 'groups', scope] as const,
  serviceBookings: (serviceId: string, scope: BookingScope, page: number) =>
    ['admin', 'service-bookings', serviceId, scope, page] as const,
};
export const useAdminServices = () =>
  useQuery({
    queryKey: adminKeys.services,
    queryFn: async () =>
      (await apiClient.get<IApiResponse<IService[]>>('/admin/services')).data.data,
  });
export const useAdminBookings = (
  page = 1,
  scope: BookingScope = 'all',
  sort: 'newest' | 'oldest' | 'startAsc' = 'newest',
) =>
  useQuery({
    queryKey: adminKeys.bookings(page, scope, sort),
    queryFn: async () =>
      (
        await apiClient.get<IApiResponse<IPaginatedBookings>>('/admin/bookings', {
          params: { page, scope, sort },
        })
      ).data.data,
  });
export const useAdminBookingGroups = (scope: BookingScope = 'all') =>
  useQuery({
    queryKey: adminKeys.bookingGroups(scope),
    queryFn: async () =>
      (
        await apiClient.get<IApiResponse<IAdminBookingGrouping>>('/admin/bookings/groups', {
          params: { scope },
        })
      ).data.data,
  });
export const useAdminServiceBookings = (
  serviceId: string,
  scope: BookingScope = 'confirmed',
  page = 1,
  enabled = true,
) =>
  useQuery({
    queryKey: adminKeys.serviceBookings(serviceId, scope, page),
    queryFn: async () =>
      (
        await apiClient.get<IApiResponse<IPaginatedBookings>>(`/bookings/service/${serviceId}`, {
          params: { page, scope, sort: 'startAsc' },
        })
      ).data.data,
    enabled: Boolean(serviceId && enabled),
  });
export const useConfirmBooking = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: ConfirmBookingDTO }) =>
      (await apiClient.patch<IApiResponse<IBooking>>(`/admin/bookings/${id}/confirm`, dto)).data
        .data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.bookingsRoot });
      void client.invalidateQueries({ queryKey: ['admin', 'service-bookings'] });
      void client.invalidateQueries({ queryKey: adminKeys.services });
      void client.invalidateQueries({ queryKey: ['services'] });
    },
  });
};
export const useRejectBooking = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: RejectBookingDTO }) =>
      (await apiClient.patch<IApiResponse<IBooking>>(`/admin/bookings/${id}/reject`, dto)).data
        .data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.bookingsRoot });
      void client.invalidateQueries({ queryKey: ['admin', 'service-bookings'] });
      void client.invalidateQueries({ queryKey: ['services'] });
    },
  });
};
export const useCancelBooking = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: CancelBookingDTO }) =>
      (await apiClient.patch<IApiResponse<IBooking>>(`/admin/bookings/${id}/cancel`, dto)).data
        .data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.bookingsRoot });
      void client.invalidateQueries({ queryKey: ['admin', 'service-bookings'] });
      void client.invalidateQueries({ queryKey: ['services'] });
    },
  });
};
export const useCreateService = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateServiceDTO) =>
      (await apiClient.post<IApiResponse<IService>>('/services', dto)).data.data,
    onSuccess: () => void client.invalidateQueries({ queryKey: adminKeys.services }),
  });
};
export const useUpdateService = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateServiceDTO }) =>
      (await apiClient.put<IApiResponse<IService>>(`/services/${id}`, dto)).data.data,
    onSuccess: () => void client.invalidateQueries({ queryKey: adminKeys.services }),
  });
};
export const useBlockServiceDates = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: BlockServiceDatesDTO }) =>
      (await apiClient.post<IApiResponse<IService>>(`/services/${id}/blocked-dates`, dto)).data
        .data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.services });
      void client.invalidateQueries({ queryKey: ['services'] });
    },
  });
};
export const useUnblockServiceDates = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, blockId }: { id: string; blockId: string }) =>
      (await apiClient.delete<IApiResponse<IService>>(`/services/${id}/blocked-dates/${blockId}`))
        .data.data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.services });
      void client.invalidateQueries({ queryKey: ['services'] });
    },
  });
};
export const useDeleteService = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/services/${id}`),
    onSuccess: () => void client.invalidateQueries({ queryKey: adminKeys.services }),
  });
};
export const useCreateServiceType = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateServiceTypeDTO) =>
      (await apiClient.post<IApiResponse<IServiceType>>('/services/types', dto)).data.data,
    onSuccess: (created) => {
      client.setQueryData<IServiceType[]>(['services', 'types'], (current = []) =>
        current.some((type) => type.slug === created.slug) ? current : [...current, created],
      );
      void client.invalidateQueries({ queryKey: ['services', 'types'] });
    },
  });
};
export const useUpdateServiceType = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateServiceTypeDTO }) =>
      (await apiClient.put<IApiResponse<IServiceType>>(`/services/types/${id}`, dto)).data.data,
    onSuccess: () => void client.invalidateQueries({ queryKey: ['services', 'types'] }),
  });
};
export const useDeleteServiceType = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cascade }: { id: string; cascade: boolean }) =>
      (
        await apiClient.delete<IApiResponse<IDeleteServiceTypeResult>>(`/services/types/${id}`, {
          params: { cascade },
        })
      ).data.data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['services', 'types'] });
      void client.invalidateQueries({ queryKey: adminKeys.services });
      void client.invalidateQueries({ queryKey: adminKeys.bookingsRoot });
    },
  });
};

interface ICloudinaryUploadResult {
  secure_url: string;
}
const uploadFilesToCloudinary = async (files: File[]): Promise<string[]> => {
  const signature = (
    await apiClient.get<IApiResponse<ICloudinaryUploadSignature>>(
      '/services/uploads/cloudinary-signature',
    )
  ).data.data;
  return Promise.all(
    files.map(async (file) => {
      const body = new FormData();
      body.append('file', file);
      body.append('api_key', signature.apiKey);
      body.append('timestamp', String(signature.timestamp));
      body.append('signature', signature.signature);
      body.append('folder', signature.folder);
      body.append('allowed_formats', signature.allowedFormats);
      const response = await axios.post<ICloudinaryUploadResult>(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        body,
      );
      return response.data.secure_url;
    }),
  );
};
export const useUploadServiceImages = () => useMutation({ mutationFn: uploadFilesToCloudinary });
