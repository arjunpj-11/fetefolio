import type { IService, IServiceType, ServiceTypeIconName } from '@programme/contracts';
import { Edit3, Eye, Plus, Trash2, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { EmptyState, ErrorState } from '../../../shared/components/Feedback';
import { Modal } from '../../../shared/components/Modal';
import { Spinner } from '../../../shared/components/Spinner';
import { StampBadge } from '../../../shared/components/StampBadge';
import { formatCurrency } from '../../../shared/utils/formatters';
import { getServiceCategoryConfig } from '../../services/serviceConfig';
import { useServiceTypes } from '../../services/hooks/useServices';
import { getServiceTypeIcon } from '../../services/components/ServiceTypeIcon';
import { ServiceTypeIconPicker } from '../components/ServiceTypeIconPicker';
import {
  useAdminServices,
  useDeleteService,
  useDeleteServiceType,
  useUpdateServiceType,
} from '../hooks/useAdmin';

interface IServiceTypeManagerProps {
  types: IServiceType[];
  services: IService[];
  onDeleted: (slug: string) => void;
}

function ServiceTypeManager({ types, services, onDeleted }: IServiceTypeManagerProps) {
  const updateType = useUpdateServiceType();
  const removeType = useDeleteServiceType();
  const [editing, setEditing] = useState<IServiceType | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<ServiceTypeIconName>('sparkles');
  const [deleting, setDeleting] = useState<IServiceType | null>(null);
  const countFor = (type: IServiceType) =>
    type.serviceCount ?? services.filter((service) => service.category === type.slug).length;
  const beginEdit = (type: IServiceType) => {
    updateType.reset();
    setEditing(type);
    setName(type.label);
    setIcon(type.icon ?? 'sparkles');
  };
  const saveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    updateType.mutate(
      { id: editing.id, dto: { name, icon } },
      { onSuccess: () => setEditing(null) },
    );
  };
  const requestDelete = (type: IServiceType) => {
    removeType.reset();
    if (countFor(type) === 0)
      removeType.mutate({ id: type.id, cascade: false }, { onSuccess: () => onDeleted(type.slug) });
    else setDeleting(type);
  };
  const confirmDelete = () => {
    if (!deleting) return;
    removeType.mutate(
      { id: deleting.id, cascade: true },
      {
        onSuccess: () => {
          onDeleted(deleting.slug);
          setDeleting(null);
        },
      },
    );
  };
  return (
    <section className="admin-type-manager" aria-labelledby="service-type-manager-title">
      <header>
        <div>
          <span>SERVICE TYPE MANAGEMENT</span>
          <h2 id="service-type-manager-title">Edit or remove service types</h2>
          <p>Every service type is dynamic and can be corrected or removed here.</p>
        </div>
      </header>
      {types.length > 0 ? (
        <div className="admin-type-list">
          {types.map((type) => {
            const count = countFor(type);
            const TypeIcon = getServiceTypeIcon(type.icon);
            return (
              <article key={type.id}>
                <i className="admin-type-list__icon">
                  <TypeIcon />
                </i>
                <div>
                  <strong>{type.label}</strong>
                  <small>
                    {count} {count === 1 ? 'service' : 'services'}
                  </small>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => beginEdit(type)}
                    aria-label={`Edit ${type.label}`}
                  >
                    <Edit3 />
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDelete(type)}
                    disabled={removeType.isPending}
                    aria-label={`Remove ${type.label}`}
                  >
                    <X />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="admin-type-manager__empty">
          <strong>No service types yet</strong>
          <span>Create your first type from the service-type selector while adding a service.</span>
        </div>
      )}
      {removeType.isError && !deleting && (
        <p className="form-alert" role="alert">
          {getApiMessage(removeType.error)}
        </p>
      )}

      <Modal
        open={Boolean(editing)}
        title="Edit service type"
        placement="center"
        onClose={() => {
          if (!updateType.isPending) setEditing(null);
        }}
      >
        <form className="service-type-edit-form" onSubmit={saveEdit}>
          <label>
            <span>Service type name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={60}
              autoFocus
              required
            />
          </label>
          <ServiceTypeIconPicker value={icon} onChange={setIcon} />
          <small>The internal link stays unchanged, so existing services continue to work.</small>
          {updateType.isError && (
            <p className="form-alert" role="alert">
              {getApiMessage(updateType.error)}
            </p>
          )}
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(null)}
              disabled={updateType.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateType.isPending || name.trim().length < 2}>
              {updateType.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Remove ${deleting?.label ?? 'service type'}?`}
        message={
          deleting
            ? `This type contains ${countFor(deleting)} ${countFor(deleting) === 1 ? 'service' : 'services'}. Confirming will permanently remove the type and those services. If any service has a pending or confirmed upcoming booking, removal will be blocked.`
            : ''
        }
        confirmLabel="Remove type and services"
        tone="danger"
        pending={removeType.isPending}
        error={removeType.isError ? getApiMessage(removeType.error) : undefined}
        onCancel={() => {
          removeType.reset();
          setDeleting(null);
        }}
        onConfirm={confirmDelete}
      />
    </section>
  );
}

export function AdminServicesPage() {
  const services = useAdminServices();
  const serviceTypes = useServiceTypes();
  const remove = useDeleteService();
  const [category, setCategory] = useState('all');
  const [deletingService, setDeletingService] = useState<IService | null>(null);
  const types = serviceTypes.data ?? [];
  const visible = useMemo(
    () =>
      (services.data ?? []).filter(
        (service) => category === 'all' || service.category === category,
      ),
    [services.data, category],
  );
  const confirmServiceDelete = () => {
    if (!deletingService) return;
    remove.mutate(deletingService.id, { onSuccess: () => setDeletingService(null) });
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header admin-page-header--compact">
        <div>
          <span>INVENTORY</span>
          <h1>Services</h1>
          <p>Every venue, stay and specialist your customers can book.</p>
        </div>
        <Link className="button button--primary" to="/admin/services/new">
          <Plus /> Add service
        </Link>
      </header>
      <ServiceTypeManager
        types={types}
        services={services.data ?? []}
        onDeleted={(slug) => {
          if (category === slug) setCategory('all');
        }}
      />
      <div className="admin-category-tabs">
        <button
          className={category === 'all' ? 'is-active' : ''}
          onClick={() => setCategory('all')}
        >
          All <span>{services.data?.length ?? 0}</span>
        </button>
        {types.map((type) => (
          <button
            key={type.slug}
            className={category === type.slug ? 'is-active' : ''}
            onClick={() => setCategory(type.slug)}
          >
            {type.label}
            <span>
              {services.data?.filter((service) => service.category === type.slug).length ?? 0}
            </span>
          </button>
        ))}
      </div>
      {services.isLoading ? (
        <Spinner />
      ) : services.isError ? (
        <ErrorState
          message={getApiMessage(services.error)}
          onRetry={() => void services.refetch()}
        />
      ) : visible.length ? (
        <div className="admin-service-grid">
          {visible.map((service) => {
            const config = getServiceCategoryConfig(
              service.category,
              types.find((type) => type.slug === service.category),
            );
            return (
              <article className="admin-service-card" key={service.id}>
                <Link
                  className="admin-service-card__overview-link"
                  to={`/admin/services/${service.id}`}
                  aria-label={`Open ${service.title} overview`}
                />
                <div className="admin-service-card__image">
                  {service.images[0] && <img src={service.images[0]} alt={service.title} />}
                  <StampBadge
                    compact
                    label={service.isActive ? 'Live' : 'Paused'}
                    tone={service.isActive ? 'sage' : 'rosewood'}
                  />
                </div>
                <div className="admin-service-card__body">
                  <span>
                    {config.singular} · {service.location.city}
                  </span>
                  <h2>{service.title}</h2>
                  <div>
                    <strong>{formatCurrency(service.pricePerDay)}</strong>
                    <small>/ day</small>
                  </div>
                  <footer>
                    <Link to={`/admin/services/${service.id}`}>
                      <Eye /> Overview
                    </Link>
                    <Link to={`/admin/services/${service.id}/edit`}>
                      <Edit3 /> Edit
                    </Link>
                    <button
                      onClick={() => {
                        remove.reset();
                        setDeletingService(service);
                      }}
                      aria-label={`Delete ${service.title}`}
                    >
                      <Trash2 />
                    </button>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No services in this category"
          message="Add a service or choose another category."
        />
      )}
      <ConfirmDialog
        open={Boolean(deletingService)}
        title={`Delete ${deletingService?.title ?? 'service'}?`}
        message="This service will be permanently removed. A service with pending or confirmed upcoming bookings cannot be deleted."
        confirmLabel="Delete service"
        tone="danger"
        pending={remove.isPending}
        error={remove.isError ? getApiMessage(remove.error) : undefined}
        onCancel={() => {
          remove.reset();
          setDeletingService(null);
        }}
        onConfirm={confirmServiceDelete}
      />
    </div>
  );
}
