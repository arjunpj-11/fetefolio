import type { IService } from '@programme/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { TicketCard } from './TicketCard';

const service: IService = {
  id: '507f1f77bcf86cd799439011',
  title: 'Marigold Courtyard',
  category: 'venue',
  description: 'A considered courtyard for remarkable gatherings and warm evening ceremonies.',
  pricePerDay: 185000,
  location: { city: 'Jaipur', state: 'Rajasthan', address: '22 Amer Road' },
  images: [],
  contactDetails: { phone: '+91 98765 43210', email: 'hello@example.com' },
  provider: '507f1f77bcf86cd799439012',
  isActive: true,
  isAvailable: true,
  rating: 4.7,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('TicketCard', () => {
  it('renders core booking information and a detail link', () => {
    render(
      <MemoryRouter>
        <TicketCard service={service} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: service.title })).toBeInTheDocument();
    expect(screen.getByText(/₹1,85,000/)).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
    expect(screen.queryByText(/admin rating/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reviews/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('More details about ' + service.title)).toHaveAttribute(
      'href',
      '/services/' + service.id,
    );
  });

  it('passes the filtered results URL to the service page', () => {
    function DetailLocation() {
      const location = useLocation();
      return (
        <output>
          {(location.state as { serviceListReturnTo?: string } | null)?.serviceListReturnTo}
        </output>
      );
    }

    render(
      <MemoryRouter
        initialEntries={['/services?category=venue&startDate=2026-12-10&endDate=2026-12-12']}
      >
        <Routes>
          <Route path="/services" element={<TicketCard service={service} />} />
          <Route path="/services/:id" element={<DetailLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('More details about ' + service.title));
    expect(
      screen.getByText('/services?category=venue&startDate=2026-12-10&endDate=2026-12-12'),
    ).toBeInTheDocument();
  });
});
