import type { IBooking } from '@programme/contracts';
import { CalendarClock, Mail, MapPin, MessageSquareText, Phone, Ticket } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { EmptyState, ErrorState } from '../../../shared/components/Feedback';
import { Spinner } from '../../../shared/components/Spinner';
import { StampBadge } from '../../../shared/components/StampBadge';
import { Pagination } from '../../../shared/components/Pagination';
import {
  formatBookingDate,
  formatCurrency,
  getInclusiveBookingPricing,
  getServiceTitle,
} from '../../../shared/utils/formatters';
import { useMyBookings } from '../hooks/useBookings';

const statusTone = (status: IBooking['status']): 'sage' | 'rosewood' | 'marigold' =>
  status === 'pending'
    ? 'marigold'
    : status === 'rejected' || status === 'cancelled'
      ? 'rosewood'
      : 'sage';
function BookingTicket({ booking }: { booking: IBooking }) {
  const serviceId = typeof booking.service === 'string' ? booking.service : booking.service.id;
  const serviceContact =
    typeof booking.service === 'string' ? undefined : booking.service.contactDetails;
  const pricing = getInclusiveBookingPricing(booking);
  return (
    <article className={`booking-ticket booking-ticket--${booking.status}`}>
      <div className="booking-ticket__code">
        <Ticket />
        <span>{booking.status === 'pending' ? 'REQUEST' : 'BOOKING'}</span>
        <strong>{booking.id.slice(-8).toUpperCase()}</strong>
      </div>
      <div className="booking-ticket__main">
        <div>
          <span className="eyebrow">
            {typeof booking.service === 'string' ? 'SERVICE' : booking.service.category}
          </span>
          <h3>
            <Link to={`/services/${serviceId}`}>{getServiceTitle(booking.service)}</Link>
          </h3>
          <p>
            <CalendarClock /> {formatBookingDate(booking.startDate)} —{' '}
            {formatBookingDate(booking.endDate)}
          </p>
          {serviceContact && (
            <div className="booking-ticket__contact" aria-label="Service contact details">
              <a
                href={`tel:${serviceContact.phone}`}
                aria-label={`Call service at ${serviceContact.phone}`}
              >
                <Phone /> {serviceContact.phone}
              </a>
              <a
                href={`mailto:${serviceContact.email}`}
                aria-label={`Email service at ${serviceContact.email}`}
              >
                <Mail /> {serviceContact.email}
              </a>
            </div>
          )}
          {booking.rejectionReason && (
            <p className="booking-ticket__reason">
              <MessageSquareText /> Rejected: {booking.rejectionReason}
            </p>
          )}
          {booking.cancellationReason && (
            <p className="booking-ticket__reason">
              <MessageSquareText /> Cancelled: {booking.cancellationReason}
            </p>
          )}
        </div>
        <div className="booking-ticket__total">
          <span>
            {pricing.totalDays} {pricing.totalDays === 1 ? 'DAY' : 'DAYS'}
          </span>
          <strong>{formatCurrency(pricing.totalPrice)}</strong>
        </div>
      </div>
      <StampBadge compact label={booking.status} tone={statusTone(booking.status)} />
    </article>
  );
}
export function MyBookingsPage() {
  const [page, setPage] = useState(1);
  const query = useMyBookings(page);
  if (query.isLoading)
    return (
      <div className="page-loading">
        <Spinner label="Finding your booking requests" />
      </div>
    );
  if (query.isError)
    return (
      <div className="content-narrow">
        <ErrorState message={getApiMessage(query.error)} />
      </div>
    );
  const bookings = query.data?.bookings ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = bookings.filter((booking) => new Date(booking.endDate) >= today);
  const past = bookings.filter((booking) => new Date(booking.endDate) < today);
  return (
    <section className="bookings-page">
      <header className="page-heading">
        <span className="eyebrow">YOUR FETEFOLIO</span>
        <h1>Your booking requests.</h1>
        <p>Track pending requests, confirmed dates, rejections, and provider cancellations.</p>
      </header>
      <div className="booking-section">
        <div className="booking-section__title">
          <h2>Coming up</h2>
          <span>{upcoming.length.toString().padStart(2, '0')} ON THIS PAGE</span>
        </div>
        {upcoming.length ? (
          <div className="booking-list">
            {upcoming.map((booking) => (
              <BookingTicket key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming requests on this page"
            message="Check another page or discover a new service."
          />
        )}
      </div>
      {past.length > 0 && (
        <div className="booking-section booking-section--past">
          <div className="booking-section__title">
            <h2>Past requests</h2>
            <span>{past.length.toString().padStart(2, '0')} ON THIS PAGE</span>
          </div>
          <div className="booking-list">
            {past.map((booking) => (
              <BookingTicket key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}
      <Pagination
        page={query.data?.currentPage ?? page}
        totalPages={query.data?.totalPages ?? 0}
        onChange={(nextPage) => {
          setPage(nextPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        ariaLabel="My booking pages"
      />
      <Link className="button button--secondary" to="/">
        <MapPin /> Discover more services
      </Link>
    </section>
  );
}
