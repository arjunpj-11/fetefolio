import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFilterStore } from '../store';
import { ServiceListPage } from './ServiceListPage';

vi.mock('../hooks/useServices', () => ({
  useServiceTypes: () => ({
    isLoading: false,
    data: [
      {
        id: 'venue',
        slug: 'venue',
        label: 'Venues',
        singular: 'venue',
        description: 'Event spaces',
        dateLabel: 'Event dates',
      },
      {
        id: 'florists',
        slug: 'florists',
        label: 'Florists',
        singular: 'florist',
        description: 'Floral design services',
        dateLabel: 'Event dates',
      },
    ],
  }),
  useServices: () => ({
    isLoading: false,
    isError: false,
    data: { services: [], totalCount: 0, totalPages: 0 },
    refetch: vi.fn(),
  }),
  useServiceFilterMetadata: () => ({ isLoading: false, data: { cities: [] } }),
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="current-location">
      {location.pathname}
      {location.search}
    </output>
  );
}

describe('ServiceListPage', () => {
  beforeEach(() => useFilterStore.getState().resetFilters());

  it.each(['/services', '/services?category=unknown'])('returns %s to the homepage', (entry) => {
    render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/services" element={<ServiceListPage />} />
          <Route path="/" element={<div>Homepage</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Homepage')).toBeInTheDocument();
  });

  it('renders a newly created service type on the customer results page', () => {
    render(
      <MemoryRouter initialEntries={['/services?category=florists']}>
        <Routes>
          <Route path="/services" element={<ServiceListPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Florists' })).toBeInTheDocument();
    expect(screen.getByText(/Floral design services/)).toBeInTheDocument();
  });

  it('keeps selected dates in the results URL', async () => {
    render(
      <MemoryRouter initialEntries={['/services?category=venue']}>
        <Routes>
          <Route
            path="/services"
            element={
              <>
                <ServiceListPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-12-10' } });
    fireEvent.change(screen.getByLabelText('Until'), { target: { value: '2026-12-12' } });

    await waitFor(() =>
      expect(screen.getByTestId('current-location')).toHaveTextContent('startDate=2026-12-10'),
    );
    expect(screen.getByTestId('current-location')).toHaveTextContent('endDate=2026-12-12');
  });

  it('keeps keyword searches in the results URL', async () => {
    render(
      <MemoryRouter initialEntries={['/services?category=venue']}>
        <Routes>
          <Route
            path="/services"
            element={
              <>
                <ServiceListPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search services by keyword' }), {
      target: { value: 'garden' },
    });

    await waitFor(() =>
      expect(screen.getByTestId('current-location')).toHaveTextContent('search=garden'),
    );
  });
});
