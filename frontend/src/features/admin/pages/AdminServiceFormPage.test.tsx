import type { IService } from '@programme/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AvailabilityManager } from './AdminServiceFormPage';

const mocks = vi.hoisted(() => ({ block: vi.fn(), unblock: vi.fn(), resetUnblock: vi.fn() }));

vi.mock('../hooks/useAdmin', () => ({
  useBlockServiceDates: () => ({ mutate: mocks.block, isPending: false, isError: false }),
  useUnblockServiceDates: () => ({
    mutate: mocks.unblock,
    reset: mocks.resetUnblock,
    isPending: false,
    isError: false,
  }),
  useAdminServices: vi.fn(),
  useCreateService: vi.fn(),
  useCreateServiceType: vi.fn(),
  useUpdateService: vi.fn(),
}));

const service: IService = {
  id: '507f1f77bcf86cd799439011',
  title: 'Marigold Courtyard',
  category: 'venue',
  description: 'A considered courtyard for remarkable gatherings.',
  pricePerDay: 10_000,
  location: { city: 'Jaipur', state: 'Rajasthan', address: '22 Amer Road' },
  images: [],
  contactDetails: { phone: '+91 98765 41111', email: 'venue@example.com' },
  provider: '507f1f77bcf86cd799439012',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  blockedDateRanges: [
    { id: '507f1f77bcf86cd799439099', startDate: '2099-08-20', endDate: '2099-08-21' },
  ],
};

describe('AvailabilityManager', () => {
  it('allows an admin to block a service date range', () => {
    render(
      <MemoryRouter>
        <AvailabilityManager service={service} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2099-08-10' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2099-08-12' } });
    fireEvent.click(screen.getByRole('button', { name: /Block these dates/i }));

    expect(mocks.block).toHaveBeenCalledWith(
      { id: service.id, dto: { startDate: '2099-08-10', endDate: '2099-08-12' } },
      expect.any(Object),
    );
  });

  it('uses confirmation before making a blocked range available', () => {
    render(
      <MemoryRouter>
        <AvailabilityManager service={service} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Remove unavailable dates/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Make dates available' }));

    expect(mocks.unblock).toHaveBeenCalledWith(
      { id: service.id, blockId: '507f1f77bcf86cd799439099' },
      expect.any(Object),
    );
  });
});
