import { ArrowRight, CalendarCheck, Layers3, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState } from '../../../shared/components/Feedback';
import { Spinner } from '../../../shared/components/Spinner';
import {
  formatBookingDate,
  formatCurrency,
  formatDate,
  getInclusiveBookingPricing,
  getServiceTitle,
} from '../../../shared/utils/formatters';
import { useAdminBookings, useAdminServices } from '../hooks/useAdmin';
import { useServiceTypes } from '../../services/hooks/useServices';
import { getServiceCategoryConfig } from '../../services/serviceConfig';

export function AdminDashboardPage() {
  const services = useAdminServices();
  const bookings = useAdminBookings();
  const serviceTypes = useServiceTypes();
  const types = serviceTypes.data ?? [];
  if (services.isLoading || bookings.isLoading)
    return (
      <div className="admin-page-state">
        <Spinner label="Preparing your workspace" />
      </div>
    );
  if (services.isError || bookings.isError)
    return (
      <div className="admin-page-state">
        <ErrorState message="The workspace could not be loaded." />
      </div>
    );
  const confirmed =
    bookings.data?.bookings.filter((booking) => booking.status === 'confirmed') ?? [];
  const bookedValue = confirmed.reduce(
    (total, booking) => total + getInclusiveBookingPricing(booking).totalPrice,
    0,
  );
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <span>BUSINESS OVERVIEW · {formatDate(new Date(), 'EEE dd MMM yyyy')}</span>
          <h1>Good work starts with a clear view.</h1>
          <p>Manage listings, booking requests and availability from one workspace.</p>
        </div>
        <Link className="button button--primary" to="/admin/services/new">
          <Plus /> Add service
        </Link>
      </header>
      <section className="admin-metric-grid">
        <article>
          <Layers3 />
          <span>ACTIVE SERVICES</span>
          <strong>{services.data?.filter((service) => service.isActive).length ?? 0}</strong>
          <small>{services.data?.length ?? 0} total listings</small>
        </article>
        <article>
          <CalendarCheck />
          <span>CONFIRMED BOOKINGS</span>
          <strong>{confirmed.length}</strong>
          <small>Provider-verified reservations</small>
        </article>
        <article>
          <TrendingUp />
          <span>BOOKED VALUE</span>
          <strong>{formatCurrency(bookedValue)}</strong>
          <small>Across confirmed reservations</small>
        </article>
      </section>
      <section className="admin-overview-grid">
        <article className="admin-overview-card">
          <header>
            <div>
              <span>RECENT INVENTORY</span>
              <h2>Services</h2>
            </div>
            <Link to="/admin/services">
              View all <ArrowRight />
            </Link>
          </header>
          <div className="admin-overview-list">
            {services.data?.slice(0, 5).map((service) => (
              <Link to={`/admin/services/${service.id}/edit`} key={service.id}>
                <div className="admin-list-thumb">
                  {service.images[0] && <img src={service.images[0]} alt="" />}
                </div>
                <span>
                  <strong>{service.title}</strong>
                  <small>
                    {
                      getServiceCategoryConfig(
                        service.category,
                        types.find((type) => type.slug === service.category),
                      ).label
                    }{' '}
                    · {service.location.city}
                  </small>
                </span>
                <b>{formatCurrency(service.pricePerDay)}</b>
              </Link>
            ))}
          </div>
        </article>
        <article className="admin-overview-card">
          <header>
            <div>
              <span>UPCOMING WORK</span>
              <h2>Bookings</h2>
            </div>
            <Link to="/admin/bookings">
              View all <ArrowRight />
            </Link>
          </header>
          <div className="admin-overview-list">
            {confirmed.slice(0, 5).map((booking) => (
              <div key={booking.id}>
                <span className="admin-date-block">
                  <strong>{formatBookingDate(booking.startDate, 'dd')}</strong>
                  <small>{formatBookingDate(booking.startDate, 'MMM')}</small>
                </span>
                <span>
                  <strong>{getServiceTitle(booking.service)}</strong>
                  <small>
                    {formatBookingDate(booking.startDate)} – {formatBookingDate(booking.endDate)}
                  </small>
                </span>
                <b>{formatCurrency(getInclusiveBookingPricing(booking).totalPrice)}</b>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
