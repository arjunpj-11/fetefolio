import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { vi } from 'vitest';
import { useFilterStore } from '../store';
import { ServiceFilters } from './ServiceFilters';

vi.mock('../hooks/useServices', () => ({
  useServiceFilterMetadata: () => ({
    isLoading: false,
    data: {
      category: 'venue',
      cities: ['Jaipur', 'Delhi', 'Mumbai', 'Goa', 'Udaipur', 'Bengaluru', 'Chennai'],
    },
  }),
}));
const venueType = {
  id: 'venue',
  slug: 'venue',
  label: 'Venues',
  singular: 'venue',
  description: 'Event spaces',
  capacityLabel: 'Guest capacity',
  dateLabel: 'Event dates',
  createdAt: '',
} as const;

describe('ServiceFilters', () => {
  beforeEach(() => act(() => useFilterStore.getState().resetFilters()));

  it('renders category-specific controls and updates store filters', () => {
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <ServiceFilters category="venue" serviceType={venueType} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Refine venues' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Category' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Every city/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search cities' }), {
      target: { value: 'Jaip' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Jaipur' }));
    expect(useFilterStore.getState().city).toBe('Jaipur');
    expect(screen.queryByText('Guest capacity')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rating' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search services by keyword' }), {
      target: { value: 'garden' },
    });
    expect(useFilterStore.getState().search).toBe('garden');
  });

  it('shows a helpful message when a searched city is unavailable', () => {
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <ServiceFilters category="venue" serviceType={venueType} />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Every city/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search cities' }), {
      target: { value: 'Kochi' },
    });
    expect(screen.getByText('No cities found')).toBeInTheDocument();
    expect(screen.getByText(/isn’t available right now/i)).toBeInTheDocument();
  });

  it('clears an end date that falls before a newly selected start date', () => {
    act(() => useFilterStore.getState().setFilter('endDate', '2099-08-20'));
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <ServiceFilters category="venue" serviceType={venueType} />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2099-08-21' } });

    expect(useFilterStore.getState()).toMatchObject({
      startDate: '2099-08-21',
      date: '2099-08-21',
      endDate: '',
    });
  });
});
