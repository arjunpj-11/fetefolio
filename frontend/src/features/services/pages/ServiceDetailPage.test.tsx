import type { IService } from '@programme/contracts';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { addDays, format, subDays } from 'date-fns';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../auth/store';
import { useService } from '../hooks/useServices';
import { BookingPanel, ServiceDetailPage } from './ServiceDetailPage';

const { mutateBooking } = vi.hoisted(() => ({ mutateBooking: vi.fn() }));

vi.mock('../../bookings/hooks/useBookings', () => ({
  useCreateBooking: () => ({
    mutate: mutateBooking,
    reset: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    data: undefined,
  }),
}));

vi.mock('../hooks/useServices', () => ({
  useServiceAvailability: () => {
    const blocked = format(addDays(new Date(), 6), 'yyyy-MM-dd');
    return {
      isLoading: false,
      data: [{ startDate: blocked, endDate: blocked, source: 'blocked' }],
      refetch: vi.fn(),
    };
  },
  useService: vi.fn(),
  useServiceTypes: () => ({
    data: [
      {
        id: 'venue',
        slug: 'venue',
        label: 'Venues',
        singular: 'venue',
        description: 'Event spaces',
        capacityLabel: 'Guest capacity',
        dateLabel: 'Event dates',
        createdAt: '',
      },
    ],
  }),
}));

describe('BookingPanel', () => {
  beforeEach(() => mutateBooking.mockReset());

  it('shows an inclusive, live total before submission', () => {
    useAuthStore.getState().setAuth(
      {
        id: '507f1f77bcf86cd799439011',
        name: 'Guest',
        email: 'guest@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
      },
      'test-token',
    );
    const start = addDays(new Date(), 2);
    const end = addDays(start, 2);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <BookingPanel
            serviceId="507f1f77bcf86cd799439012"
            title="Courtyard"
            pricePerDay={10000}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: format(start, 'MMMM d') }));
    fireEvent.click(screen.getByRole('button', { name: format(end, 'MMMM d') }));
    expect(screen.getByText('₹30,000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send booking request' })).toBeEnabled();
    act(() => useAuthStore.getState().clearAuth());
  });

  it('disables only dates the provider has stopped accepting', () => {
    useAuthStore.getState().setAuth(
      {
        id: '507f1f77bcf86cd799439011',
        name: 'Guest',
        email: 'guest@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
      },
      'test-token',
    );
    const blocked = addDays(new Date(), 6);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <BookingPanel
            serviceId="507f1f77bcf86cd799439012"
            title="Courtyard"
            pricePerDay={10000}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const unavailableDate = screen.getByRole('button', {
      name: `${format(blocked, 'MMMM d')}, unavailable`,
    });
    expect(unavailableDate).toBeDisabled();
    expect(unavailableDate).toHaveClass('is-unavailable', 'is-blocked');
    const pastDate = screen.getByRole('button', {
      name: `${format(subDays(new Date(), 1), 'MMMM d')}, past date`,
    });
    expect(pastDate).toBeDisabled();
    expect(pastDate).toHaveClass('is-unavailable', 'is-past');
    act(() => useAuthStore.getState().clearAuth());
  });

  it('collects contact details and includes them with the reservation', () => {
    useAuthStore.getState().setAuth(
      {
        id: '507f1f77bcf86cd799439011',
        name: 'Guest Name',
        email: 'guest@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
      },
      'test-token',
    );
    const start = addDays(new Date(), 2);
    const end = addDays(start, 1);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <BookingPanel
            serviceId="507f1f77bcf86cd799439012"
            title="Courtyard"
            pricePerDay={10000}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText('Contact name')).toHaveValue('Guest Name');
    expect(screen.getByLabelText('Email address')).toHaveValue('guest@example.com');
    fireEvent.change(screen.getByLabelText('Phone number'), {
      target: { value: '+91 98765 43210' },
    });
    fireEvent.change(screen.getByLabelText(/Booking notes/i), {
      target: { value: 'Please call after 5 PM.' },
    });
    fireEvent.click(screen.getByRole('button', { name: format(start, 'MMMM d') }));
    fireEvent.click(screen.getByRole('button', { name: format(end, 'MMMM d') }));
    fireEvent.click(screen.getByRole('button', { name: 'Send booking request' }));

    expect(mutateBooking).not.toHaveBeenCalled();
    const review = screen.getByRole('dialog', { name: 'Confirm your booking request' });
    expect(within(review).getByText('+91 98765 43210')).toBeInTheDocument();
    expect(within(review).getByText('₹20,000')).toBeInTheDocument();
    fireEvent.click(within(review).getByRole('button', { name: 'Send booking request' }));

    expect(mutateBooking).toHaveBeenCalledWith(
      {
        serviceId: '507f1f77bcf86cd799439012',
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        contactDetails: {
          name: 'Guest Name',
          phone: '+91 98765 43210',
          email: 'guest@example.com',
          note: 'Please call after 5 PM.',
        },
      },
      expect.any(Object),
    );
    act(() => useAuthStore.getState().clearAuth());
  });
});

describe('ServiceDetailPage', () => {
  it('returns to the exact filtered service results URL', () => {
    const service: IService = {
      id: '507f1f77bcf86cd799439011',
      title: 'Marigold Courtyard',
      category: 'venue',
      description: 'A considered courtyard for remarkable gatherings.',
      pricePerDay: 185000,
      location: { city: 'Jaipur', state: 'Rajasthan', address: '22 Amer Road' },
      images: [],
      contactDetails: { phone: '+91 98765 43210', email: 'hello@example.com' },
      provider: '507f1f77bcf86cd799439012',
      isActive: true,
      rating: 4.7,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    vi.mocked(useService).mockReturnValue({
      isLoading: false,
      isError: false,
      data: service,
    } as unknown as ReturnType<typeof useService>);
    const returnTo = '/services?category=venue&startDate=2026-12-10&endDate=2026-12-12';

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: `/services/${service.id}`, state: { serviceListReturnTo: returnTo } },
        ]}
      >
        <Routes>
          <Route path="/services/:id" element={<ServiceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /all venues/i })).toHaveAttribute('href', returnTo);
  });
});
