import { zodResolver } from '@hookform/resolvers/zod';
import {
  createServiceSchema,
  type CreateServiceDTO,
  type IBlockedDateRange,
  type IService,
} from '@programme/contracts';
import { format } from 'date-fns';
import { ArrowLeft, CalendarOff, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { Button } from '../../../shared/components/Button';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { Input } from '../../../shared/components/Input';
import { Spinner } from '../../../shared/components/Spinner';
import { formatDate } from '../../../shared/utils/formatters';
import { getServiceCategoryConfig } from '../../services/serviceConfig';
import { useServiceTypes } from '../../services/hooks/useServices';
import { ServiceImageUploader } from '../components/ServiceImageUploader';
import { ServiceTypeCombobox } from '../components/ServiceTypeCombobox';
import {
  useAdminServices,
  useBlockServiceDates,
  useCreateService,
  useCreateServiceType,
  useUnblockServiceDates,
  useUpdateService,
} from '../hooks/useAdmin';

const emptyService: CreateServiceDTO = {
  title: '',
  category: '',
  description: '',
  pricePerDay: 0,
  location: { city: '', state: '', address: '' },
  images: [],
  contactDetails: { phone: '', email: '' },
  adminContactPhone: '',
  rating: 4.5,
  capacity: undefined,
  isActive: true,
};

export function AvailabilityManager({ service }: { service: IService }) {
  const block = useBlockServiceDates();
  const unblock = useUnblockServiceDates();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [removing, setRemoving] = useState<IBlockedDateRange | null>(null);
  const ranges = [...(service.blockedDateRanges ?? [])].sort((left, right) =>
    left.startDate.localeCompare(right.startDate),
  );
  const addRange = () => {
    if (!startDate || !endDate || endDate < startDate) return;
    block.mutate(
      { id: service.id, dto: { startDate, endDate } },
      {
        onSuccess: () => {
          setStartDate('');
          setEndDate('');
        },
      },
    );
  };
  const removeRange = () => {
    if (!removing) return;
    unblock.mutate(
      { id: service.id, blockId: removing.id },
      { onSuccess: () => setRemoving(null) },
    );
  };
  return (
    <section className="admin-availability-manager">
      <header>
        <span>04</span>
        <div>
          <h2>Unavailable dates</h2>
          <p>
            Block dates when this service is reserved privately, closed, or otherwise unavailable.
          </p>
        </div>
      </header>
      <div className="admin-availability-controls">
        <label>
          <span>From</span>
          <input
            type="date"
            min={today}
            value={startDate}
            onChange={(event) => {
              const next = event.target.value;
              setStartDate(next);
              if (!endDate || endDate < next) setEndDate(next);
            }}
          />
        </label>
        <label>
          <span>To</span>
          <input
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <Button
          type="button"
          onClick={addRange}
          disabled={block.isPending || !startDate || !endDate || endDate < startDate}
        >
          <CalendarOff /> {block.isPending ? 'Blocking…' : 'Block these dates'}
        </Button>
      </div>
      {block.isError && (
        <p className="form-alert" role="alert">
          {getApiMessage(block.error)}
        </p>
      )}
      <div className="admin-blocked-date-list">
        {ranges.length ? (
          ranges.map((range) => (
            <article key={range.id}>
              <CalendarOff />
              <div>
                <strong>
                  {formatDate(range.startDate)} — {formatDate(range.endDate)}
                </strong>
                <small>Customers cannot request these dates.</small>
              </div>
              <button
                type="button"
                onClick={() => {
                  unblock.reset();
                  setRemoving(range);
                }}
                aria-label={`Remove unavailable dates ${formatDate(range.startDate)} to ${formatDate(range.endDate)}`}
              >
                <Trash2 />
              </button>
            </article>
          ))
        ) : (
          <p>No dates are blocked for this service.</p>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(removing)}
        title="Make these dates available again?"
        message={
          removing
            ? `${formatDate(removing.startDate)} — ${formatDate(removing.endDate)} will become bookable by customers again.`
            : ''
        }
        confirmLabel="Make dates available"
        pending={unblock.isPending}
        error={unblock.isError ? getApiMessage(unblock.error) : undefined}
        onCancel={() => {
          unblock.reset();
          setRemoving(null);
        }}
        onConfirm={removeRange}
      />
    </section>
  );
}

export function AdminServiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const services = useAdminServices();
  const serviceTypes = useServiceTypes();
  const createType = useCreateServiceType();
  const create = useCreateService();
  const update = useUpdateService();
  const service = id ? services.data?.find((item) => item.id === id) : undefined;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateServiceDTO>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: emptyService,
  });
  const category = watch('category');
  const images = watch('images') ?? [];
  const availableTypes = serviceTypes.data ?? [];
  const selectedType = availableTypes.find((type) => type.slug === category);
  const categoryConfig = getServiceCategoryConfig(category, selectedType);
  useEffect(() => {
    if (!id && availableTypes.length > 0 && !availableTypes.some((type) => type.slug === category))
      setValue('category', availableTypes[0].slug, { shouldValidate: true });
  }, [availableTypes, category, id, setValue]);
  useEffect(() => {
    if (id && service)
      reset({
        title: service.title,
        category: service.category,
        description: service.description,
        pricePerDay: service.pricePerDay,
        location: service.location,
        images: service.images,
        contactDetails: service.contactDetails,
        adminContactPhone: service.adminContactPhone ?? '',
        rating: service.rating ?? 4.5,
        capacity: service.capacity,
        isActive: service.isActive,
      });
  }, [id, service, reset]);
  if (id && services.isLoading)
    return (
      <div className="admin-page-state">
        <Spinner />
      </div>
    );
  const submit = (dto: CreateServiceDTO) => {
    const duplicate = services.data?.find(
      (item) =>
        item.id !== id &&
        item.title.trim().toLocaleLowerCase() === dto.title.trim().toLocaleLowerCase(),
    );
    if (duplicate) {
      setError('title', {
        type: 'validate',
        message: `A service named “${duplicate.title}” already exists. Service names must be unique.`,
      });
      return;
    }
    clearErrors('title');
    const clean = { ...dto, images: dto.images.filter(Boolean) };
    if (id)
      update.mutate({ id, dto: clean }, { onSuccess: () => void navigate('/admin/services') });
    else create.mutate(clean, { onSuccess: () => void navigate('/admin/services') });
  };
  const mutation = id ? update : create;
  return (
    <div className="admin-page admin-editor">
      <header className="admin-page-header admin-page-header--compact">
        <div>
          <Link className="admin-back-link" to="/admin/services">
            <ArrowLeft /> Back to services
          </Link>
          <span>{id ? 'EDIT LISTING' : 'NEW LISTING'}</span>
          <h1>{id ? 'Update service' : 'Add a service'}</h1>
          <p>Only the fields relevant to the selected service type are shown to customers.</p>
        </div>
      </header>
      <form className="admin-editor-form" onSubmit={handleSubmit(submit)}>
        <section>
          <header>
            <span>01</span>
            <div>
              <h2>Service basics</h2>
              <p>Name the service and choose where it belongs. Names must be unique.</p>
            </div>
          </header>
          <div className="admin-form-grid">
            <Input label="Service name" error={errors.title?.message} {...register('title')} />
            <input type="hidden" {...register('category')} />
            <ServiceTypeCombobox
              types={availableTypes}
              value={category}
              error={errors.category?.message}
              onChange={(slug) =>
                setValue('category', slug, { shouldDirty: true, shouldValidate: true })
              }
              onCreate={(name) => createType.mutateAsync({ name })}
            />
            <label className="field admin-form-full">
              <span>Description</span>
              <textarea rows={6} {...register('description')} />
              <small>{errors.description?.message}</small>
            </label>
            <Input
              label="Price per day (₹)"
              type="number"
              error={errors.pricePerDay?.message}
              {...register('pricePerDay')}
            />
            {categoryConfig.capacityLabel && (
              <Input
                label={`${categoryConfig.capacityLabel} (maximum guests)`}
                type="number"
                error={errors.capacity?.message}
                {...register('capacity')}
              />
            )}
            <Input
              label="Admin rating (1–5)"
              type="number"
              step="0.1"
              min="1"
              max="5"
              error={errors.rating?.message}
              {...register('rating')}
            />
          </div>
        </section>
        <section>
          <header>
            <span>02</span>
            <div>
              <h2>Location & contacts</h2>
              <p>
                The public phone and email are shown to customers. The admin-only provider phone is
                used internally while confirming requests.
              </p>
            </div>
          </header>
          <div className="admin-form-grid admin-form-grid--three">
            <Input
              label="City"
              error={errors.location?.city?.message}
              {...register('location.city')}
            />
            <Input
              label="State"
              error={errors.location?.state?.message}
              {...register('location.state')}
            />
            <Input
              label="Street address"
              error={errors.location?.address?.message}
              {...register('location.address')}
            />
            <Input
              label="Public phone"
              type="tel"
              error={errors.contactDetails?.phone?.message}
              {...register('contactDetails.phone')}
            />
            <Input
              label="Public email"
              type="email"
              error={errors.contactDetails?.email?.message}
              {...register('contactDetails.email')}
            />
            <Input
              label="Admin-only provider phone"
              type="tel"
              placeholder="Used to verify availability"
              required
              error={errors.adminContactPhone?.message}
              {...register('adminContactPhone')}
            />
          </div>
        </section>
        <section>
          <header>
            <span>03</span>
            <div>
              <h2>Photos</h2>
              <p>
                Drop image files or choose them from your device. They are uploaded securely to
                Cloudinary; the first image becomes the cover.
              </p>
            </div>
          </header>
          <ServiceImageUploader
            images={images.filter(Boolean)}
            error={errors.images?.message}
            onChange={(nextImages) =>
              setValue('images', nextImages, { shouldDirty: true, shouldValidate: true })
            }
          />
        </section>
        {service && <AvailabilityManager service={service} />}
        <section className="admin-publish-section">
          <label className="check-field">
            <input type="checkbox" {...register('isActive')} />
            <span>
              <strong>Publish this listing</strong>
              <small>Customers can discover and book it immediately.</small>
            </span>
          </label>
          {mutation.isError && <p className="form-alert">{getApiMessage(mutation.error)}</p>}
          <div>
            <Link className="button button--ghost" to="/admin/services">
              Cancel
            </Link>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : id ? 'Save changes' : 'Publish service'}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
