import type {
  IApiResponse,
  IAuthPayload,
  IRegistrationPending,
  LoginDTO,
  RegisterDTO,
  ResendRegistrationOtpDTO,
  VerifyRegistrationDTO,
} from '@programme/contracts';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../shared/api/axiosClient';
import { useAuthStore } from '../store';

const postAuth = async (
  path: 'login' | 'verify-registration',
  dto: LoginDTO | VerifyRegistrationDTO,
): Promise<IAuthPayload> =>
  (await apiClient.post<IApiResponse<IAuthPayload>>(`/auth/${path}`, dto)).data.data;
const postRegistrationStep = async (
  path: 'register' | 'resend-registration-otp',
  dto: RegisterDTO | ResendRegistrationOtpDTO,
): Promise<IRegistrationPending> =>
  (await apiClient.post<IApiResponse<IRegistrationPending>>(`/auth/${path}`, dto)).data.data;
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: (dto: LoginDTO) => postAuth('login', dto),
    onSuccess: ({ user, token }) => setAuth(user, token),
  });
};
export const useRegister = () =>
  useMutation({ mutationFn: (dto: RegisterDTO) => postRegistrationStep('register', dto) });
export const useVerifyRegistration = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: (dto: VerifyRegistrationDTO) => postAuth('verify-registration', dto),
    onSuccess: ({ user, token }) => setAuth(user, token),
  });
};
export const useResendRegistrationOtp = () =>
  useMutation({
    mutationFn: (dto: ResendRegistrationOtpDTO) =>
      postRegistrationStep('resend-registration-otp', dto),
  });
