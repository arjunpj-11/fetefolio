import type {
  CreateBookingDTO,
  IApiResponse,
  IBooking,
  IPaginatedBookings,
} from '@programme/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/axiosClient';
export const bookingKeys = {
  myRoot: ['bookings', 'my'] as const,
  my: (page: number) => ['bookings', 'my', page] as const,
};
export const useMyBookings = (page = 1) =>
  useQuery({
    queryKey: bookingKeys.my(page),
    queryFn: async () =>
      (await apiClient.get<IApiResponse<IPaginatedBookings>>('/bookings/my', { params: { page } }))
        .data.data,
  });
export const useCreateBooking = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateBookingDTO) =>
      (await apiClient.post<IApiResponse<IBooking>>('/bookings', dto)).data.data,
    onSuccess: () => void client.invalidateQueries({ queryKey: bookingKeys.myRoot }),
  });
};
