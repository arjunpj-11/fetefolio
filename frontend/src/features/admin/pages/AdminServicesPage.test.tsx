import type { IService, IServiceType } from '@programme/contracts';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminServicesPage } from './AdminServicesPage';

const mocks = vi.hoisted(() => ({
  deleteService: vi.fn(),
  deleteType: vi.fn(),
  updateType: vi.fn(),
  serviceTypes: vi.fn(),
  adminServices: vi.fn(),
}));

const types: IServiceType[] = [
  {
    id: '507f1f77bcf86cd799439021',
    slug: 'venue',
    label: 'Venuse',
    singular: 'venue',
    description: 'Event spaces',
    dateLabel: 'Event dates',
    icon: 'venue',
    createdAt: '',
    serviceCount: 2,
  },
  {
    id: '507f1f77bcf86cd799439022',
    slug: 'decor',
    label: 'Decor',
    singular: 'decor',
    description: 'Decor',
    dateLabel: 'Event dates',
    createdAt: '',
    serviceCount: 0,
  },
];
const service: IService = {
  id: '507f1f77bcf86cd799439011',
  title: 'Marigold Courtyard',
  category: 'venue',
  description: 'A complete event service for celebrations.',
  pricePerDay: 25000,
  location: { city: 'Jaipur', state: 'Rajasthan', address: '22 Amer Road' },
  images: [],
  contactDetails: { phone: '+91 98765 43210', email: 'hello@example.com' },
  provider: '507f1f77bcf86cd799439012',
  isActive: true,
  createdAt: '',
};

vi.mock('../../services/hooks/useServices', () => ({ useServiceTypes: mocks.serviceTypes }));
vi.mock('../hooks/useAdmin', () => ({
  useAdminServices: mocks.adminServices,
  useDeleteService: () => ({
    mutate: mocks.deleteService,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useDeleteServiceType: () => ({
    mutate: mocks.deleteType,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useUpdateServiceType: () => ({
    mutate: mocks.updateType,
    reset: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

describe('AdminServicesPage', () => {
  beforeEach(() => {
    mocks.deleteService.mockReset();
    mocks.deleteType.mockReset();
    mocks.updateType.mockReset();
    mocks.serviceTypes.mockReturnValue({ data: types });
    mocks.adminServices.mockReturnValue({
      data: [service],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('edits the spelling of an existing starter service type', () => {
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit Venuse' }));
    fireEvent.change(screen.getByLabelText('Service type name'), { target: { value: 'Venues' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(mocks.updateType).toHaveBeenCalledWith(
      { id: types[0].id, dto: { name: 'Venues', icon: 'venue' } },
      expect.any(Object),
    );
  });

  it('allows the symbol of every service type to be customized', () => {
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit Venuse' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit service type' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Venue' }));
    fireEvent.click(within(dialog).getByRole('option', { name: 'Music or DJ' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(mocks.updateType).toHaveBeenCalledWith(
      { id: types[0].id, dto: { name: 'Venuse', icon: 'music' } },
      expect.any(Object),
    );
  });

  it('removes an empty service type without a cascade warning', () => {
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove Decor' }));
    expect(mocks.deleteType).toHaveBeenCalledWith(
      { id: types[1].id, cascade: false },
      expect.any(Object),
    );
    expect(screen.queryByRole('dialog', { name: /Remove Decor/i })).not.toBeInTheDocument();
  });

  it('warns before cascading removal of a populated service type', () => {
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Remove Venuse' }));
    const dialog = screen.getByRole('dialog', { name: /Remove Venuse/i });
    expect(within(dialog).getByText(/contains 2 services/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remove type and services' }));
    expect(mocks.deleteType).toHaveBeenCalledWith(
      { id: types[0].id, cascade: true },
      expect.any(Object),
    );
  });

  it('uses a centered confirmation dialog before deleting a service', () => {
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: `Delete ${service.title}` }));
    const dialog = screen.getByRole('dialog', { name: `Delete ${service.title}?` });
    expect(mocks.deleteService).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete service' }));
    expect(mocks.deleteService).toHaveBeenCalledWith(service.id, expect.any(Object));
  });

  it('opens a service overview from the card while keeping a separate edit action', () => {
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: `Open ${service.title} overview` })).toHaveAttribute(
      'href',
      `/admin/services/${service.id}`,
    );
    expect(screen.getByRole('link', { name: /Edit/i })).toHaveAttribute(
      'href',
      `/admin/services/${service.id}/edit`,
    );
  });

  it('shows an empty state when no service types exist', () => {
    mocks.serviceTypes.mockReturnValue({ data: [] });
    mocks.adminServices.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('No service types yet')).toBeInTheDocument();
    expect(screen.getByText(/Create your first type/i)).toBeInTheDocument();
  });
});
