import type { CreateBookingDTO, IUnavailableRange } from '@programme/contracts';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameMonth,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { Button } from '../../../shared/components/Button';
import { ErrorState } from '../../../shared/components/Feedback';
import { Modal } from '../../../shared/components/Modal';
import { Spinner } from '../../../shared/components/Spinner';
import { StampBadge } from '../../../shared/components/StampBadge';
import { formatBookingDate, formatCurrency, formatDate } from '../../../shared/utils/formatters';
import { useAuthStore } from '../../auth/store';
import { useCreateBooking } from '../../bookings/hooks/useBookings';
import { useService, useServiceAvailability, useServiceTypes } from '../hooks/useServices';
import { getServiceCategoryConfig } from '../serviceConfig';
import { ServiceImageGallery } from '../components/ServiceImageGallery';

const toKey = (date: Date) => format(date, 'yyyy-MM-dd');
const getBlockingRange = (date: Date, ranges: IUnavailableRange[]) => {
  const key = toKey(date);
  return ranges.find((range) => key >= range.startDate && key <= range.endDate);
};
const isBlocked = (date: Date, ranges: IUnavailableRange[]) =>
  Boolean(getBlockingRange(date, ranges));

function AvailabilityCalendar({
  ranges,
  start,
  end,
  onChange,
}: {
  ranges: IUnavailableRange[];
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  const today = startOfToday();
  const [month, setMonth] = useState(startOfMonth(today));
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });
  const choose = (date: Date) => {
    const key = toKey(date);
    if (!start || end || key < start) {
      onChange(key, '');
      return;
    }
    const rangeDays = eachDayOfInterval({ start: new Date(`${start}T00:00:00`), end: date });
    if (rangeDays.some((day) => isBlocked(day, ranges))) {
      onChange(key, '');
      return;
    }
    onChange(start, key);
  };
  return (
    <div className="availability-calendar">
      <div className="availability-calendar__head">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          disabled={isBefore(endOfMonth(addMonths(month, -1)), today)}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>
        <strong>{format(month, 'MMMM yyyy')}</strong>
        <button type="button" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
          <ChevronRight />
        </button>
      </div>
      <div className="availability-calendar__week">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="availability-calendar__grid">
        {days.map((date) => {
          const key = toKey(date);
          const blockingRange = getBlockingRange(date, ranges);
          const blocked = Boolean(blockingRange);
          const past = isBefore(date, today);
          const outside = !isSameMonth(date, month);
          const selected = key === start || key === end;
          const inRange = Boolean(start && end && key > start && key < end);
          const unavailable = !outside && (blocked || past);
          const stateLabel = blocked
            ? blockingRange?.source === 'blocked'
              ? ', unavailable'
              : ', booked'
            : past
              ? ', past date'
              : '';
          return (
            <button
              type="button"
              key={key}
              disabled={blocked || past || outside}
              className={`${unavailable ? 'is-unavailable' : ''} ${blocked ? 'is-blocked' : ''} ${past ? 'is-past' : ''} ${outside ? 'is-outside' : ''} ${selected ? 'is-selected' : ''} ${inRange ? 'is-in-range' : ''}`}
              onClick={() => choose(date)}
              aria-label={`${format(date, 'MMMM d')}${stateLabel}`}
            >
              <span>{format(date, 'd')}</span>
            </button>
          );
        })}
      </div>
      <div className="availability-calendar__legend">
        <span>
          <i />
          Available
        </span>
        <span>
          <i className="unavailable" />
          Past / unavailable
        </span>
        <span>
          <i className="selected" />
          Your dates
        </span>
      </div>
    </div>
  );
}

export function BookingPanel({
  serviceId,
  title,
  pricePerDay,
}: {
  serviceId: string;
  title: string;
  pricePerDay: number;
}) {
  const user = useAuthStore((state) => state.user);
  const mutation = useCreateBooking();
  const today = startOfToday();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [contactName, setContactName] = useState(user?.name ?? '');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [contactNote, setContactNote] = useState('');
  const availability = useServiceAvailability(serviceId, toKey(today), toKey(addDays(today, 365)));
  const totalDays =
    start && end
      ? differenceInCalendarDays(new Date(`${end}T00:00:00`), new Date(`${start}T00:00:00`)) + 1
      : 0;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (start && end) {
      mutation.reset();
      setReviewOpen(true);
    }
  };
  const confirmRequest = () => {
    if (start && end)
      mutation.mutate(
        {
          serviceId,
          startDate: start,
          endDate: end,
          contactDetails: {
            name: contactName.trim(),
            phone: contactPhone.trim(),
            email: contactEmail.trim(),
            ...(contactNote.trim() ? { note: contactNote.trim() } : {}),
          },
        } satisfies CreateBookingDTO,
        { onSuccess: () => setReviewOpen(false) },
      );
  };
  const resetBooking = () => {
    mutation.reset();
    setReviewOpen(false);
    setStart('');
    setEnd('');
    setContactPhone('');
    setContactNote('');
    setContactName(user?.name ?? '');
    setContactEmail(user?.email ?? '');
    void availability.refetch();
  };
  return (
    <div className="booking-panel">
      <div className="booking-panel__head">
        <div>
          <span>LIVE AVAILABILITY</span>
          <small>Dates closed by the provider are disabled</small>
        </div>
        <strong>
          {formatCurrency(pricePerDay)} <small>/ DAY</small>
        </strong>
      </div>
      {user?.role === 'user' ? (
        <form className="booking-form" onSubmit={submit}>
          {availability.isLoading ? (
            <Spinner label="Checking availability" />
          ) : (
            <AvailabilityCalendar
              ranges={availability.data ?? []}
              start={start}
              end={end}
              onChange={(nextStart, nextEnd) => {
                setStart(nextStart);
                setEnd(nextEnd);
                mutation.reset();
              }}
            />
          )}
          <div className="selected-dates">
            <div>
              <span>START</span>
              <strong>{start ? formatDate(start) : 'Choose a date'}</strong>
            </div>
            <ChevronRight />
            <div>
              <span>END</span>
              <strong>{end ? formatDate(end) : 'Choose a date'}</strong>
            </div>
          </div>
          <div className="price-preview">
            <span>
              <b>{totalDays || '—'}</b> {totalDays === 1 ? 'DAY' : 'DAYS'}
            </span>
            <i />
            <span>
              TOTAL <strong>{totalDays ? formatCurrency(totalDays * pricePerDay) : '—'}</strong>
            </span>
          </div>
          <section className="booking-contact-form" aria-labelledby="booking-contact-title">
            <header>
              <UserRound />
              <div>
                <h3 id="booking-contact-title">Your contact details</h3>
                <p>The provider will use these details to coordinate your booking.</p>
              </div>
            </header>
            <div className="booking-contact-grid">
              <label>
                <span>Contact name</span>
                <input
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  required
                />
              </label>
              <label>
                <span>Phone number</span>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  minLength={7}
                  maxLength={20}
                  autoComplete="tel"
                  placeholder="e.g. +91 98765 43210"
                  required
                />
              </label>
              <label className="booking-contact-full">
                <span>Email address</span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  maxLength={254}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="booking-contact-full">
                <span>
                  Booking notes <small>Optional</small>
                </span>
                <textarea
                  value={contactNote}
                  onChange={(event) => setContactNote(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Preferred contact time or anything the provider should know"
                />
              </label>
            </div>
          </section>
          {mutation.isError && (
            <p className="form-alert" role="alert">
              {getApiMessage(mutation.error)}
            </p>
          )}
          <Button type="submit" disabled={!totalDays || mutation.isPending}>
            {mutation.isPending ? 'Sending request…' : 'Send booking request'}
          </Button>
          <p className="booking-assurance">
            <ShieldCheck /> Your details are shared only with the provider for reviewing this
            request.
          </p>
        </form>
      ) : user?.role === 'admin' ? (
        <p className="booking-role-note">
          Provider accounts manage availability from the admin workspace.
        </p>
      ) : (
        <div className="booking-signin">
          <p>Sign in with a guest account to see live dates and send a booking request.</p>
          <Link className="button button--primary" to="/login">
            Sign in to book
          </Link>
        </div>
      )}
      {reviewOpen && (
        <Modal
          open={!mutation.isSuccess}
          title="Confirm your booking request"
          placement="center"
          onClose={() => {
            if (!mutation.isPending) {
              setReviewOpen(false);
              mutation.reset();
            }
          }}
        >
          <div className="booking-review">
            <div className="booking-review__service">
              <span>YOU’RE REQUESTING</span>
              <h3>{title}</h3>
              <p>
                <CalendarDays /> {formatDate(start)} — {formatDate(end)}
              </p>
            </div>
            <dl>
              <div>
                <dt>Contact name</dt>
                <dd>{contactName.trim()}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{contactPhone.trim()}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{contactEmail.trim()}</dd>
              </div>
              {contactNote.trim() && (
                <div>
                  <dt>Notes</dt>
                  <dd>{contactNote.trim()}</dd>
                </div>
              )}
            </dl>
            <div className="booking-review__total">
              <span>
                {totalDays} {totalDays === 1 ? 'day' : 'days'}
              </span>
              <strong>{formatCurrency(totalDays * pricePerDay)}</strong>
            </div>
            <p className="booking-review__notice">
              Please confirm these details. The request will be sent to the provider only after you
              continue.
            </p>
            {mutation.isError && (
              <p className="form-alert" role="alert">
                {getApiMessage(mutation.error)}
              </p>
            )}
            <div className="booking-review__actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  mutation.reset();
                  setReviewOpen(false);
                }}
                disabled={mutation.isPending}
              >
                Edit details
              </Button>
              <Button type="button" onClick={confirmRequest} disabled={mutation.isPending}>
                {mutation.isPending ? 'Sending request…' : 'Send booking request'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <Modal open={mutation.isSuccess} title="Booking request sent" onClose={resetBooking}>
        <div className="confirmation">
          <StampBadge label="Pending approval" tone="marigold" />
          <h3>{title}</h3>
          <p>
            The provider will review your request. We’ll update your bookings after they confirm or
            reject it.
          </p>
          {mutation.data && (
            <>
              <p>
                {formatBookingDate(mutation.data.startDate)} —{' '}
                {formatBookingDate(mutation.data.endDate)}
              </p>
              <div className="confirmation__code">
                REQUEST · {mutation.data.id.slice(-8).toUpperCase()}
              </div>
              <strong>{formatCurrency(mutation.data.totalPrice)}</strong>
            </>
          )}
          <Button onClick={resetBooking}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}

export function ServiceDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const service = useService(id);
  const serviceTypes = useServiceTypes();
  if (service.isLoading)
    return (
      <div className="page-loading">
        <Spinner label="Opening service" />
      </div>
    );
  if (service.isError || !service.data)
    return (
      <div className="content-narrow">
        <ErrorState message={getApiMessage(service.error)} />
        <Link className="back-link" to="/">
          <ArrowLeft /> Back to services
        </Link>
      </div>
    );
  const item = service.data;
  const config = getServiceCategoryConfig(
    item.category,
    serviceTypes.data?.find((type) => type.slug === item.category),
  );
  const requestedReturnTo = (location.state as { serviceListReturnTo?: unknown } | null)
    ?.serviceListReturnTo;
  const fallbackReturnTo = `/services?category=${encodeURIComponent(item.category)}`;
  const returnTo =
    typeof requestedReturnTo === 'string' && requestedReturnTo.startsWith('/services?')
      ? requestedReturnTo
      : fallbackReturnTo;
  return (
    <article className="service-detail">
      <div className="service-detail__crumb">
        <Link to={returnTo}>
          <ArrowLeft /> ALL {config.label.toUpperCase()}
        </Link>
      </div>
      <section className="service-detail__hero">
        <ServiceImageGallery images={item.images} title={item.title} />
        <div className="service-detail__intro">
          <span className="category-tag">{config.singular}</span>
          <h1>{item.title}</h1>
          <div
            className="detail-rating"
            aria-label={`Rating ${(item.rating ?? 4.5).toFixed(1)} out of 5`}
          >
            <Star />
            <strong>{(item.rating ?? 4.5).toFixed(1)}</strong>
            <span>/ 5</span>
          </div>
          <p className="service-lede">{item.description}</p>
          <div className="service-location">
            <MapPin />
            <span>
              <strong>
                {item.location.city}, {item.location.state}
              </strong>
              <small>{item.location.address}</small>
            </span>
          </div>
        </div>
      </section>
      <section className="service-detail__body">
        <div className="service-details-copy">
          <span className="eyebrow">SERVICE DETAILS</span>
          <h2>What this {config.singular} offers</h2>
          <p>{item.description}</p>
          {item.capacity && (
            <dl className="service-spec-grid">
              <div>
                <dt>{config.capacityLabel ?? 'Capacity'}</dt>
                <dd>Up to {item.capacity.toLocaleString()} guests</dd>
              </div>
            </dl>
          )}
          <div className="contact-card">
            <span>PROVIDER CONTACT</span>
            <a href={`tel:${item.contactDetails.phone}`}>
              <Phone /> {item.contactDetails.phone}
            </a>
            <a href={`mailto:${item.contactDetails.email}`}>
              <Mail /> {item.contactDetails.email}
            </a>
          </div>
          <ul className="service-assurances">
            <li>
              <Check /> Transparent daily pricing
            </li>
            <li>
              <Check /> Provider-managed availability
            </li>
            <li>
              <CalendarDays /> Provider-reviewed booking requests
            </li>
          </ul>
        </div>
        <BookingPanel serviceId={item.id} title={item.title} pricePerDay={item.pricePerDay} />
      </section>
    </article>
  );
}
