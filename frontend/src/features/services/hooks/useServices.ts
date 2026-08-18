import type {
  IApiResponse,
  IPaginatedServices,
  IService,
  IServiceFilterMetadata,
  IServiceType,
  IUnavailableRange,
  ServiceCategory,
  ServiceQueryDTO,
} from '@programme/contracts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/axiosClient';
export const serviceKeys = {
  all: ['services'] as const,
  types: ['services', 'types'] as const,
  availableTypes: (startDate: string, endDate: string) =>
    ['services', 'types', 'available', startDate, endDate] as const,
  list: (query: Partial<ServiceQueryDTO>) => ['services', 'list', query] as const,
  detail: (id: string) => ['services', 'detail', id] as const,
  filters: (category: ServiceCategory) => ['services', 'filters', category] as const,
  availability: (id: string, from: string, to: string) =>
    ['services', 'availability', id, from, to] as const,
};
export const useServiceTypes = () =>
  useQuery({
    queryKey: serviceKeys.types,
    queryFn: async () =>
      (await apiClient.get<IApiResponse<IServiceType[]>>('/services/types')).data.data,
    staleTime: 5 * 60 * 1000,
  });
export const useAvailableServiceTypes = (requestedStart = '', requestedEnd = '') => {
  const today = new Date().toISOString().slice(0, 10);
  const startDate = requestedStart || today;
  const endDate = requestedEnd || startDate;
  return useQuery({
    queryKey: serviceKeys.availableTypes(startDate, endDate),
    queryFn: async () =>
      (
        await apiClient.get<IApiResponse<IServiceType[]>>('/services/types', {
          params: { availableOnly: true, startDate, endDate },
        })
      ).data.data,
    staleTime: 60 * 1000,
  });
};
export const useServices = (query: Partial<ServiceQueryDTO>) =>
  useQuery({
    queryKey: serviceKeys.list(query),
    queryFn: async () =>
      (await apiClient.get<IApiResponse<IPaginatedServices>>('/services', { params: query })).data
        .data,
  });
export const useService = (id: string) =>
  useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: async () => (await apiClient.get<IApiResponse<IService>>(`/services/${id}`)).data.data,
    enabled: Boolean(id),
  });
export const useServiceFilterMetadata = (category: ServiceCategory) =>
  useQuery({
    queryKey: serviceKeys.filters(category),
    queryFn: async () =>
      (
        await apiClient.get<IApiResponse<IServiceFilterMetadata>>('/services/meta/filters', {
          params: { category },
        })
      ).data.data,
  });
export const useServiceAvailability = (id: string, from: string, to: string) =>
  useQuery({
    queryKey: serviceKeys.availability(id, from, to),
    queryFn: async () =>
      (
        await apiClient.get<IApiResponse<IUnavailableRange[]>>(`/services/${id}/availability`, {
          params: { from, to },
        })
      ).data.data,
    enabled: Boolean(id && from && to),
  });
