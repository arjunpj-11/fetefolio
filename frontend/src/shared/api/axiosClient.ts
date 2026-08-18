import axios from 'axios';
import { useAuthStore } from '../../features/auth/store';

const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:5055/api' : '/api';
const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || defaultApiUrl;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401)
      useAuthStore.getState().clearAuth();
    return Promise.reject(error);
  },
);
export const getApiMessage = (error: unknown): string => {
  if (!axios.isAxiosError<{ message?: string }>(error)) return 'Something unexpected happened.';
  if (!error.response) return 'The booking service is offline. Start the full app and try again.';
  return error.response.data.message ?? 'Unable to reach Fetefolio. Please try again.';
};
