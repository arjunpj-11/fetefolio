import type { IUserPublic } from '@programme/contracts';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IAuthState {
  user: IUserPublic | null;
  token: string | null;
  setAuth: (user: IUserPublic, token: string) => void;
  clearAuth: () => void;
}
export const useAuthStore = create<IAuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    { name: 'programme-auth' },
  ),
);
