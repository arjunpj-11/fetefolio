import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { HomePage } from './HomePage';

vi.mock('../hooks/useServices', () => ({
  useServices: () => ({
    isLoading: false,
    isError: false,
    data: { services: [], currentPage: 1, totalPages: 0, totalCount: 0 },
    refetch: vi.fn(),
  }),
  useAvailableServiceTypes: () => ({
    data: [
      {
        id: 'venue',
        slug: 'venue',
        label: 'Venues',
        singular: 'venue',
        description: 'Event spaces',
        dateLabel: 'Event dates',
        createdAt: '',
      },
      {
        id: 'hotel',
        slug: 'hotel',
        label: 'Stays & villas',
        singular: 'stay',
        description: 'Guest stays',
        dateLabel: 'Stay dates',
        createdAt: '',
      },
    ],
  }),
}));

describe('HomePage', () => {
  it('offers available service categories and sends homepage filters to discovery', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<div>Service results</div>} />
        </Routes>
      </MemoryRouter>,
    );
    const venueLink = screen.getByRole('link', { name: /Venues/ });
    expect(venueLink).toHaveAttribute('href', '/services?category=venue');
    expect(venueLink.closest('.category-entry__grid')).toHaveAttribute('data-count', '2');
    expect(screen.getByRole('link', { name: /Stays/ })).toHaveAttribute(
      'href',
      '/services?category=hotel',
    );
    expect(screen.getByRole('heading', { name: 'Fresh on Fetefolio' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Explore Venues' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Destination city'), { target: { value: 'Jaipur' } });
    fireEvent.click(screen.getByRole('button', { name: /Show venues/i }));
    expect(await screen.findByText('Service results')).toBeInTheDocument();
  });
});
