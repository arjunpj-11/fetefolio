import type { IBooking } from '@programme/contracts';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminBookingsPage } from './AdminBookingsPage';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  reject: vi.fn(),
  cancel: vi.fn(),
  page: vi.fn(),
  scope: vi.fn(),
}));
const booking: IBooking = {
  id: '507f1f77bcf86cd799439011',
  user: '507f1f77bcf86cd799439012',
  service: {
    id: '507f1f77bcf86cd799439013',
    title: 'Marigold Courtyard',
    category: 'venue',
    pricePerDay: 10000,
    contactDetails: { phone: '+91 98765 41111', email: 'venue@example.com' },
    adminContactPhone: '+91 90000 11111',
  },
  startDate: '2026-12-10T00:00:00.000Z',
  endDate: '2026-12-11T23:59:59.999Z',
  totalDays: 2,
  totalPrice: 20000,
  contactDetails: { name: 'Guest Name', phone: '+91 98765 43210', email: 'guest@example.com' },
  status: 'pending',
  createdAt: '',
};

vi.mock('../hooks/useAdmin', () => ({
  useAdminBookings: (page = 1, scope = 'all') => {
    mocks.page(page);
    mocks.scope(scope);
    return {
      isLoading: false,
      isError: false,
      data: { bookings: [booking], currentPage: page, totalPages: 2, totalCount: 21 },
    };
  },
  useAdminBookingGroups: () => ({
    isLoading: false,
    isError: false,
    data: {
      counts: { all: 1, pending: 1, upcoming: 0, past: 0 },
      groups: [
        {
          service: booking.service,
          bookingCount: 1,
          pendingCount: 1,
          upcomingCount: 0,
          pastCount: 0,
          totalValue: 0,
          nextStartDate: booking.startDate,
        },
      ],
    },
  }),
  useAdminServiceBookings: () => ({
    isLoading: false,
    isError: false,
    data: { bookings: [booking], currentPage: 1, totalPages: 1, totalCount: 1 },
  }),
  useConfirmBooking: () => ({
    mutate: mocks.confirm,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useRejectBooking: () => ({
    mutate: mocks.reject,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useCancelBooking: () => ({
    mutate: mocks.cancel,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

describe('AdminBookingsPage', () => {
  beforeEach(() => {
    booking.status = 'pending';
    mocks.confirm.mockReset();
    mocks.reject.mockReset();
    mocks.cancel.mockReset();
    mocks.page.mockClear();
    mocks.scope.mockClear();
    window.scrollTo = vi.fn();
  });

  it('allows an admin to confirm a pending request', () => {
    render(
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(mocks.confirm).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog', { name: 'Confirm booking request' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm booking' }));
    expect(mocks.confirm).toHaveBeenCalledWith({ id: booking.id, dto: {} }, expect.any(Object));
  });

  it('can block only a selected portion of the requested dates while confirming', () => {
    render(
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirm booking request' });
    fireEvent.click(within(dialog).getByRole('radio', { name: /Stop new requests/i }));
    fireEvent.change(within(dialog).getByLabelText('Block until'), {
      target: { value: '2026-12-10' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and block selected dates' }),
    );
    expect(mocks.confirm).toHaveBeenCalledWith(
      { id: booking.id, dto: { blockDates: { startDate: '2026-12-10', endDate: '2026-12-10' } } },
      expect.any(Object),
    );
  });

  it('requires and sends a rejection reason', () => {
    render(
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    const dialog = screen.getByRole('dialog', { name: 'Reject booking request' });
    const submit = within(dialog).getByRole('button', { name: 'Reject and notify customer' });
    expect(submit).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Reason for rejection'), {
      target: { value: 'The venue is closed for maintenance.' },
    });
    fireEvent.click(submit);
    expect(mocks.reject).toHaveBeenCalledWith(
      { id: booking.id, dto: { reason: 'The venue is closed for maintenance.' } },
      expect.any(Object),
    );
  });

  it('lets an admin cancel a confirmed booking with a reason', () => {
    booking.status = 'confirmed';
    render(
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancel confirmed booking' });
    const submit = within(dialog).getByRole('button', { name: 'Cancel and notify customer' });
    expect(submit).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Reason for cancellation'), {
      target: { value: 'The provider is closed for emergency repairs.' },
    });
    fireEvent.click(submit);
    expect(mocks.cancel).toHaveBeenCalledWith(
      { id: booking.id, dto: { reason: 'The provider is closed for emergency repairs.' } },
      expect.any(Object),
    );
  });

  it('loads another page of provider bookings', () => {
    render(
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(mocks.page).toHaveBeenLastCalledWith(2);
  });

  it('filters the workspace into pending, upcoming, and past views', () => {
    render(
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('tab', { name: /Pending/i }));
    expect(mocks.scope).toHaveBeenLastCalledWith('pending');
    fireEvent.click(screen.getByRole('tab', { name: /Upcoming/i }));
    expect(mocks.scope).toHaveBeenLastCalledWith('upcoming');
    fireEvent.click(screen.getByRole('tab', { name: /Past/i }));
    expect(mocks.scope).toHaveBeenLastCalledWith('past');
  });

  it('groups requests by service and expands the selected service', () => {
    render(
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /By service/i }));
    const group = screen.getByRole('button', { name: /Marigold Courtyard.*1 booking/i });
    expect(group).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(group);
    expect(group).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('shows the admin-only provider number as plain information on every booking view', () => {
    render(
      <MemoryRouter>
        <AdminBookingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('+91 90000 11111')).toBeInTheDocument();
    expect(screen.queryByText('Call service')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /90000 11111/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /By service/i }));
    expect(screen.getByText('+91 90000 11111')).toBeInTheDocument();
    expect(screen.queryByText('Call service')).not.toBeInTheDocument();
  });
});
