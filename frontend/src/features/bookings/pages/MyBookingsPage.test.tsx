import type { IBooking } from '@programme/contracts';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MyBookingsPage } from './MyBookingsPage';

const booking: IBooking = {
  id: '507f1f77bcf86cd799439011',
  user: '507f1f77bcf86cd799439012',
  service: {
    id: '507f1f77bcf86cd799439013',
    title: 'Marigold Courtyard',
    category: 'venue',
    pricePerDay: 10000,
    contactDetails: { phone: '+91 98765 41111', email: 'venue@example.com' },
  },
  startDate: '2026-12-10T00:00:00.000Z',
  endDate: '2026-12-11T23:59:59.999Z',
  totalDays: 2,
  totalPrice: 20000,
  status: 'rejected',
  rejectionReason: 'The venue is closed for maintenance.',
  createdAt: '',
};

vi.mock('../hooks/useBookings', () => ({
  useMyBookings: () => ({
    isLoading: false,
    isError: false,
    data: { bookings: [booking], currentPage: 1, totalPages: 1, totalCount: 1 },
  }),
}));

describe('MyBookingsPage', () => {
  beforeEach(() => {
    booking.status = 'rejected';
    booking.rejectionReason = 'The venue is closed for maintenance.';
    booking.cancellationReason = undefined;
  });

  it('shows the provider rejection reason to the customer', () => {
    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Status: rejected')).toBeInTheDocument();
    expect(screen.getByText(/Rejected: The venue is closed for maintenance/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Call service at +91 98765 41111' })).toHaveAttribute(
      'href',
      'tel:+91 98765 41111',
    );
    expect(
      screen.getByRole('link', { name: 'Email service at venue@example.com' }),
    ).toHaveAttribute('href', 'mailto:venue@example.com');
  });

  it('shows a provider cancellation reason to the customer', () => {
    booking.status = 'cancelled';
    booking.rejectionReason = undefined;
    booking.cancellationReason = 'The provider is closed for emergency repairs.';
    render(
      <MemoryRouter>
        <MyBookingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Status: cancelled')).toBeInTheDocument();
    expect(
      screen.getByText(/Cancelled: The provider is closed for emergency repairs/i),
    ).toBeInTheDocument();
  });
});
