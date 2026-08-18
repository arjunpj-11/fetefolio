import type { IBooking, IService, IServiceType } from '@programme/contracts';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { AdminServiceOverviewPage } from './AdminServiceOverviewPage';

const service: IService = {
  id: '507f1f77bcf86cd799439011',
  title: 'Marigold Courtyard',
  category: 'venue',
  description: 'A complete event service for remarkable celebrations.',
  pricePerDay: 25_000,
  location: { city: 'Jaipur', state: 'Rajasthan', address: '22 Amer Road' },
  images: ['https://images.example.com/venue.jpg'],
  contactDetails: { phone: '+91 98765 43210', email: 'hello@example.com' },
  provider: '507f1f77bcf86cd799439012',
  isActive: true,
  rating: 4.7,
  capacity: 300,
  createdAt: '',
};
const type: IServiceType = {
  id: '507f1f77bcf86cd799439021',
  slug: 'venue',
  label: 'Venues',
  singular: 'venue',
  description: 'Event spaces',
  dateLabel: 'Event dates',
  createdAt: '',
};
const booking: IBooking = {
  id: '507f1f77bcf86cd799439031',
  user: '507f1f77bcf86cd799439032',
  service: {
    id: service.id,
    title: service.title,
    category: service.category,
    pricePerDay: service.pricePerDay,
    contactDetails: service.contactDetails,
  },
  startDate: '2026-12-10T00:00:00.000Z',
  endDate: '2026-12-11T23:59:59.999Z',
  totalDays: 2,
  totalPrice: 50_000,
  contactDetails: { name: 'Guest Name', phone: '+91 90000 00000', email: 'guest@example.com' },
  status: 'confirmed',
  createdAt: '',
};

vi.mock('../../services/hooks/useServices', () => ({
  useServiceTypes: () => ({ data: [type], isLoading: false }),
}));
vi.mock('../hooks/useAdmin', () => ({
  useAdminServices: () => ({ data: [service], isLoading: false, isError: false }),
  useAdminBookingGroups: () => ({
    data: {
      counts: { all: 1, pending: 0, upcoming: 1, past: 0 },
      groups: [
        {
          service: booking.service,
          bookingCount: 1,
          pendingCount: 0,
          upcomingCount: 1,
          pastCount: 0,
          totalValue: 50_000,
          nextStartDate: booking.startDate,
        },
      ],
    },
  }),
  useAdminServiceBookings: () => ({
    data: { bookings: [booking], currentPage: 1, totalPages: 1, totalCount: 1 },
    isLoading: false,
    isError: false,
  }),
}));

describe('AdminServiceOverviewPage', () => {
  it('shows service photos, status metrics, and confirmed bookings without opening the editor', () => {
    render(
      <MemoryRouter initialEntries={[`/admin/services/${service.id}`]}>
        <Routes>
          <Route path="/admin/services/:id" element={<AdminServiceOverviewPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: service.title })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /photo 1 of 1/i })).toHaveAttribute(
      'src',
      service.images[0],
    );
    expect(screen.getByText('Accepted reservations').previousElementSibling).toHaveTextContent('1');
    expect(screen.getByRole('heading', { name: 'Guest Name' })).toBeInTheDocument();
    expect(screen.getByLabelText('Status: confirmed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Edit service/i })).toHaveAttribute(
      'href',
      `/admin/services/${service.id}/edit`,
    );
  });
});
