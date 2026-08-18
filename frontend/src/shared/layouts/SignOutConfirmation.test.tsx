import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../../features/auth/store';
import { AdminLayout } from './AdminLayout';
import { MainLayout } from './MainLayout';

vi.mock('../../features/services/hooks/useServices', () => ({
  useAvailableServiceTypes: () => ({ data: [] }),
}));

const user = {
  id: '507f1f77bcf86cd799439011',
  name: 'Account Owner',
  email: 'owner@example.com',
  role: 'user' as const,
  createdAt: '',
};
const admin = { ...user, role: 'admin' as const };

describe('sign-out confirmation', () => {
  afterEach(() => act(() => useAuthStore.getState().clearAuth()));

  it('asks a customer to confirm before signing out', () => {
    act(() => useAuthStore.getState().setAuth(user, 'token'));
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Sign out/i })[0]);
    expect(useAuthStore.getState().user).toEqual(user);
    const dialog = screen.getByRole('dialog', { name: 'Sign out?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('asks an administrator to confirm before signing out', () => {
    act(() => useAuthStore.getState().setAuth(admin, 'token'));
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div>Admin home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Sign out/i })[0]);
    expect(useAuthStore.getState().user).toEqual(admin);
    const dialog = screen.getByRole('dialog', { name: 'Sign out of admin?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));
    expect(useAuthStore.getState().user).toBeNull();
  });
});
