import type { IServiceType } from '@programme/contracts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ServiceTypeCombobox } from './ServiceTypeCombobox';

const types: IServiceType[] = [
  {
    id: '1',
    slug: 'venue',
    label: 'Venues',
    singular: 'venue',
    description: 'Event spaces',
    dateLabel: 'Event dates',
    createdAt: '',
  },
  {
    id: '2',
    slug: 'hotel',
    label: 'Stays & villas',
    singular: 'stay',
    description: 'Guest stays',
    dateLabel: 'Stay dates',
    createdAt: '',
  },
];

describe('ServiceTypeCombobox', () => {
  it('searches existing types and creates a missing type', async () => {
    const onChange = vi.fn();
    const onCreate = vi
      .fn()
      .mockResolvedValue({ ...types[0], id: '3', slug: 'florists', label: 'Florists' });
    render(
      <ServiceTypeCombobox types={types} value="venue" onChange={onChange} onCreate={onCreate} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Venues/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search service types' }), {
      target: { value: 'Florists' },
    });
    expect(screen.getByText('No matching service type found.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create “Florists”' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Florists'));
    expect(onChange).toHaveBeenCalledWith('florists');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('does not offer to recreate an existing type', () => {
    render(
      <ServiceTypeCombobox types={types} value="venue" onChange={vi.fn()} onCreate={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Venues/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search service types' }), {
      target: { value: 'venues' },
    });
    expect(screen.queryByRole('button', { name: /Create/ })).not.toBeInTheDocument();
  });
});
