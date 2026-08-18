import type { IBooking } from '@programme/contracts';
import {
  ArrowLeft,
  CalendarCheck,
  Edit3,
  ImageOff,
  Images,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { EmptyState, ErrorState } from '../../../shared/components/Feedback';
import { Pagination } from '../../../shared/components/Pagination';
import { Spinner } from '../../../shared/components/Spinner';
import { StampBadge } from '../../../shared/components/StampBadge';
import {
  formatBookingDate,
  formatCurrency,
  getInclusiveBookingPricing,
} from '../../../shared/utils/formatters';
import { getServiceCategoryConfig } from '../../services/serviceConfig';
import { useServiceTypes } from '../../services/hooks/useServices';
import {
  useAdminBookingGroups,
  useAdminServiceBookings,
  useAdminServices,
} from '../hooks/useAdmin';

function AdminServiceGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const available = images.filter((image) => !failed.includes(image));
  useEffect(() => {
    if (active >= available.length) setActive(0);
  }, [active, available.length]);
  return (
    <section className="admin-service-overview__gallery" aria-label={`${title} photos`}>
      <div className="admin-service-overview__main-image">
        {available.length ? (
          <img
            src={available[active]}
            alt={`${title} — photo ${active + 1} of ${available.length}`}
            onError={() => setFailed((current) => [...current, available[active]])}
          />
        ) : (
          <div className="service-image-fallback">
            <ImageOff />
            <span>Photos coming soon</span>
          </div>
        )}
        <span>
          <Images />
          {available.length} {available.length === 1 ? 'photo' : 'photos'}
        </span>
      </div>
      {available.length > 1 && (
        <div className="admin-service-overview__thumbs">
          {available.map((image, index) => (
            <button
              type="button"
              key={image}
              className={active === index ? 'is-active' : ''}
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              <img src={image} alt="" onError={() => setFailed((current) => [...current, image])} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ConfirmedBookingCard({ booking }: { booking: IBooking }) {
  const pricing = getInclusiveBookingPricing(booking);
  return (
    <article className="admin-service-confirmed-booking">
      <div className="admin-service-confirmed-booking__date">
        <strong>{formatBookingDate(booking.startDate, 'dd')}</strong>
        <span>{formatBookingDate(booking.startDate, 'MMM yyyy')}</span>
      </div>
      <div>
        <span>BOOKING · {booking.id.slice(-8).toUpperCase()}</span>
        <h3>{booking.contactDetails?.name ?? 'Customer details unavailable'}</h3>
        <p>
          {formatBookingDate(booking.startDate)} — {formatBookingDate(booking.endDate)} ·{' '}
          {pricing.totalDays} {pricing.totalDays === 1 ? 'day' : 'days'}
        </p>
      </div>
      {booking.contactDetails && (
        <div className="admin-service-confirmed-booking__contact">
          <a href={`tel:${booking.contactDetails.phone}`}>
            <Phone />
            {booking.contactDetails.phone}
          </a>
          <a href={`mailto:${booking.contactDetails.email}`}>
            <Mail />
            {booking.contactDetails.email}
          </a>
        </div>
      )}
      <strong>{formatCurrency(pricing.totalPrice)}</strong>
      <StampBadge compact label={booking.status} tone="sage" />
    </article>
  );
}

export function AdminServiceOverviewPage() {
  const { id = '' } = useParams();
  const services = useAdminServices();
  const serviceTypes = useServiceTypes();
  const grouping = useAdminBookingGroups('confirmed');
  const [page, setPage] = useState(1);
  const bookings = useAdminServiceBookings(id, 'confirmed', page);
  if (services.isLoading || serviceTypes.isLoading)
    return (
      <div className="admin-page-state">
        <Spinner label="Opening service overview" />
      </div>
    );
  if (services.isError)
    return (
      <div className="admin-page-state">
        <ErrorState message={getApiMessage(services.error)} />
      </div>
    );
  const service = services.data?.find((item) => item.id === id);
  if (!service)
    return (
      <div className="admin-page">
        <Link className="admin-back-link" to="/admin/services">
          <ArrowLeft /> Back to services
        </Link>
        <EmptyState
          title="Service not found"
          message="It may have been removed or belongs to another provider."
        />
      </div>
    );
  const config = getServiceCategoryConfig(
    service.category,
    serviceTypes.data?.find((type) => type.slug === service.category),
  );
  const stats = grouping.data?.groups.find((group) => group.service.id === service.id);
  return (
    <div className="admin-page admin-service-overview">
      <div className="admin-service-overview__topbar">
        <Link className="admin-back-link" to="/admin/services">
          <ArrowLeft /> Back to services
        </Link>
        <Link className="button button--primary" to={`/admin/services/${service.id}/edit`}>
          <Edit3 /> Edit service
        </Link>
      </div>
      <section className="admin-service-overview__hero">
        <AdminServiceGallery images={service.images} title={service.title} />
        <div className="admin-service-overview__summary">
          <div className="admin-service-overview__status">
            <StampBadge
              compact
              label={service.isActive ? 'Live' : 'Paused'}
              tone={service.isActive ? 'sage' : 'rosewood'}
            />
            <span>{config.singular}</span>
          </div>
          <h1>{service.title}</h1>
          <p>{service.description}</p>
          <dl>
            <div>
              <dt>
                <MapPin /> Location
              </dt>
              <dd>
                {service.location.address}, {service.location.city}, {service.location.state}
              </dd>
            </div>
            <div>
              <dt>
                <CalendarCheck /> Daily rate
              </dt>
              <dd>{formatCurrency(service.pricePerDay)}</dd>
            </div>
            {service.capacity && (
              <div>
                <dt>
                  <Users /> Capacity
                </dt>
                <dd>Up to {service.capacity.toLocaleString()} guests</dd>
              </div>
            )}
            <div>
              <dt>
                <Star /> Rating
              </dt>
              <dd>{(service.rating ?? 4.5).toFixed(1)} / 5</dd>
            </div>
          </dl>
          <div className="admin-service-overview__provider">
            <span>ADMIN-ONLY PROVIDER PHONE</span>
            <strong>
              <Phone />
              {service.adminContactPhone ?? 'Not added yet'}
            </strong>
            <span>CUSTOMER-FACING CONTACT</span>
            <a href={`tel:${service.contactDetails.phone}`}>
              <Phone />
              {service.contactDetails.phone}
            </a>
            <a href={`mailto:${service.contactDetails.email}`}>
              <Mail />
              {service.contactDetails.email}
            </a>
          </div>
        </div>
      </section>
      <section className="admin-service-overview__metrics" aria-label="Confirmed booking summary">
        <article>
          <span>CONFIRMED BOOKINGS</span>
          <strong>{stats?.bookingCount ?? 0}</strong>
          <small>Accepted reservations</small>
        </article>
        <article>
          <span>UPCOMING</span>
          <strong>{stats?.upcomingCount ?? 0}</strong>
          <small>Still to be delivered</small>
        </article>
        <article>
          <span>PAST</span>
          <strong>{stats?.pastCount ?? 0}</strong>
          <small>Completed dates</small>
        </article>
        <article>
          <span>CONFIRMED VALUE</span>
          <strong>{formatCurrency(stats?.totalValue ?? 0)}</strong>
          <small>Across confirmed bookings</small>
        </article>
      </section>
      <section className="admin-service-overview__bookings">
        <header>
          <div>
            <span>CONFIRMED RESERVATIONS</span>
            <h2>Booking history</h2>
            <p>Only confirmed bookings for this service appear here.</p>
          </div>
          <Link to="/admin/bookings">Open booking workspace</Link>
        </header>
        {bookings.isLoading ? (
          <Spinner />
        ) : bookings.isError ? (
          <ErrorState message={getApiMessage(bookings.error)} />
        ) : bookings.data?.bookings.length ? (
          <div>
            {bookings.data.bookings.map((booking) => (
              <ConfirmedBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No confirmed bookings yet"
            message="Confirmed requests will appear here with their customer details and status."
          />
        )}
        <Pagination
          page={bookings.data?.currentPage ?? page}
          totalPages={bookings.data?.totalPages ?? 0}
          onChange={setPage}
          ariaLabel={`${service.title} confirmed booking pages`}
        />
      </section>
    </div>
  );
}
