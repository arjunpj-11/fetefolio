import type { BookingScope, IAdminBookingServiceGroup, IBooking } from '@programme/contracts';
import {
  CalendarDays,
  CalendarOff,
  Check,
  ChevronDown,
  ChevronRight,
  Layers3,
  List,
  Mail,
  MessageSquareText,
  Phone,
  UserRound,
  X,
} from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { Button } from '../../../shared/components/Button';
import { EmptyState, ErrorState } from '../../../shared/components/Feedback';
import { Modal } from '../../../shared/components/Modal';
import { Pagination } from '../../../shared/components/Pagination';
import { Spinner } from '../../../shared/components/Spinner';
import { StampBadge } from '../../../shared/components/StampBadge';
import {
  formatBookingDate,
  formatCurrency,
  getBookingDateKey,
  getInclusiveBookingPricing,
  getServiceTitle,
} from '../../../shared/utils/formatters';
import {
  useAdminBookingGroups,
  useAdminBookings,
  useAdminServiceBookings,
  useCancelBooking,
  useConfirmBooking,
  useRejectBooking,
} from '../hooks/useAdmin';

type WorkspaceScope = Exclude<BookingScope, 'confirmed'>;
type WorkspaceMode = 'bookings' | 'services';
type BookingSort = 'newest' | 'oldest' | 'startAsc';
type GroupSort = 'volume' | 'service' | 'date';

const statusTone = (status: IBooking['status']): 'sage' | 'rosewood' | 'marigold' =>
  status === 'pending'
    ? 'marigold'
    : status === 'rejected' || status === 'cancelled'
      ? 'rosewood'
      : 'sage';

const scopeOptions: Array<{ value: WorkspaceScope; label: string; description: string }> = [
  { value: 'all', label: 'All', description: 'Every booking status' },
  { value: 'pending', label: 'Pending', description: 'Requests awaiting a call' },
  { value: 'upcoming', label: 'Upcoming', description: 'Confirmed future work' },
  { value: 'past', label: 'Past', description: 'Confirmed work already completed' },
];

interface IBookingRowProps {
  booking: IBooking;
  mutationPending: boolean;
  onConfirm: (booking: IBooking) => void;
  onReject: (booking: IBooking) => void;
  onCancel: (booking: IBooking) => void;
}

function BookingRow({ booking, mutationPending, onConfirm, onReject, onCancel }: IBookingRowProps) {
  const pricing = getInclusiveBookingPricing(booking);
  const adminContactPhone =
    typeof booking.service === 'string' ? undefined : booking.service.adminContactPhone;
  return (
    <article className="admin-booking-row">
      <div className="admin-booking-date">
        <CalendarDays />
        <strong>{formatBookingDate(booking.startDate, 'dd')}</strong>
        <span>{formatBookingDate(booking.startDate, 'MMM yyyy')}</span>
      </div>
      <div className="admin-booking-summary">
        <span>BOOKING · {booking.id.slice(-8).toUpperCase()}</span>
        <h2>{getServiceTitle(booking.service)}</h2>
        <p>
          {formatBookingDate(booking.startDate)} — {formatBookingDate(booking.endDate)} ·{' '}
          {pricing.totalDays} {pricing.totalDays === 1 ? 'day' : 'days'}
        </p>
        {booking.rejectionReason && (
          <p className="admin-booking-rejection">
            <MessageSquareText /> Rejection reason: {booking.rejectionReason}
          </p>
        )}
        {booking.cancellationReason && (
          <p className="admin-booking-rejection">
            <MessageSquareText /> Cancellation reason: {booking.cancellationReason}
          </p>
        )}
      </div>
      <div className="admin-booking-contact">
        <span className="admin-booking-contact__label">PROVIDER CONTACT</span>
        <strong className={!adminContactPhone ? 'is-missing' : ''}>
          <Phone />
          {adminContactPhone ?? 'Not added to this service'}
        </strong>
        <span className="admin-booking-contact__label">CUSTOMER</span>
        {booking.contactDetails ? (
          <>
            <strong>
              <UserRound />
              {booking.contactDetails.name}
            </strong>
            <a href={`tel:${booking.contactDetails.phone}`}>
              <Phone />
              {booking.contactDetails.phone}
            </a>
            <a href={`mailto:${booking.contactDetails.email}`}>
              <Mail />
              {booking.contactDetails.email}
            </a>
            {booking.contactDetails.note && (
              <p>
                <MessageSquareText />
                {booking.contactDetails.note}
              </p>
            )}
          </>
        ) : (
          <div className="admin-booking-contact--empty">
            <strong>Contact details unavailable</strong>
            <p>This reservation was created before contact details were collected.</p>
          </div>
        )}
      </div>
      <strong className="admin-booking-price">{formatCurrency(pricing.totalPrice)}</strong>
      <div className="admin-booking-status">
        <StampBadge compact label={booking.status} tone={statusTone(booking.status)} />
        {booking.status === 'pending' && (
          <div className="admin-booking-actions">
            <button type="button" onClick={() => onConfirm(booking)} disabled={mutationPending}>
              <Check /> Confirm
            </button>
            <button type="button" onClick={() => onReject(booking)} disabled={mutationPending}>
              <X /> Reject
            </button>
          </div>
        )}
        {booking.status === 'confirmed' && (
          <div className="admin-booking-actions">
            <button type="button" onClick={() => onCancel(booking)} disabled={mutationPending}>
              <X /> Cancel booking
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

interface IServiceGroupProps extends Omit<IBookingRowProps, 'booking'> {
  group: IAdminBookingServiceGroup;
  scope: WorkspaceScope;
  expanded: boolean;
  onToggle: () => void;
}

function ServiceBookingGroup({
  group,
  scope,
  expanded,
  onToggle,
  mutationPending,
  onConfirm,
  onReject,
  onCancel,
}: IServiceGroupProps) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [scope]);
  const bookings = useAdminServiceBookings(group.service.id, scope, page, expanded);
  return (
    <section className={`admin-service-booking-group ${expanded ? 'is-open' : ''}`}>
      <header>
        <button
          type="button"
          className="admin-service-booking-group__toggle"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <span className="admin-service-booking-group__icon">
            <Layers3 />
          </span>
          <span className="admin-service-booking-group__title">
            <strong>{group.service.title}</strong>
            <small>
              {group.bookingCount} {group.bookingCount === 1 ? 'booking' : 'bookings'} in this view
            </small>
          </span>
          <span className="admin-service-booking-group__counts">
            <b>
              {group.pendingCount}
              <small>pending</small>
            </b>
            <b>
              {group.upcomingCount}
              <small>upcoming</small>
            </b>
            <b>
              {group.pastCount}
              <small>past</small>
            </b>
          </span>
          <span className="admin-service-booking-group__value">
            <strong>{formatCurrency(group.totalValue)}</strong>
            <small>
              {group.nextStartDate
                ? `Next ${formatBookingDate(group.nextStartDate, 'dd MMM')}`
                : 'No upcoming date'}
            </small>
          </span>
          {expanded ? <ChevronDown /> : <ChevronRight />}
        </button>
        <div className="admin-service-booking-group__contact">
          <span>PROVIDER CONTACT</span>
          <strong>
            <Phone />
            {group.service.adminContactPhone ?? 'Not added'}
          </strong>
        </div>
      </header>
      {expanded && (
        <div className="admin-service-booking-group__body">
          {bookings.isLoading ? (
            <Spinner label={`Loading ${group.service.title} bookings`} />
          ) : bookings.isError ? (
            <ErrorState message={getApiMessage(bookings.error)} />
          ) : bookings.data?.bookings.length ? (
            <div className="admin-booking-list">
              {bookings.data.bookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  mutationPending={mutationPending}
                  onConfirm={onConfirm}
                  onReject={onReject}
                  onCancel={onCancel}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No bookings in this view" message="Choose another booking filter." />
          )}
          <Pagination
            page={bookings.data?.currentPage ?? page}
            totalPages={bookings.data?.totalPages ?? 0}
            onChange={setPage}
            ariaLabel={`${group.service.title} booking pages`}
          />
        </div>
      )}
    </section>
  );
}

export function AdminBookingsPage() {
  const [scope, setScope] = useState<WorkspaceScope>('all');
  const [mode, setMode] = useState<WorkspaceMode>('bookings');
  const [bookingSort, setBookingSort] = useState<BookingSort>('newest');
  const [groupSort, setGroupSort] = useState<GroupSort>('volume');
  const [page, setPage] = useState(1);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const bookings = useAdminBookings(page, scope, bookingSort);
  const grouping = useAdminBookingGroups(scope);
  const confirm = useConfirmBooking();
  const reject = useRejectBooking();
  const cancel = useCancelBooking();
  const [rejecting, setRejecting] = useState<IBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancelling, setCancelling] = useState<IBooking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [confirming, setConfirming] = useState<IBooking | null>(null);
  const [stopBookings, setStopBookings] = useState(false);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const mutationPending = confirm.isPending || reject.isPending || cancel.isPending;

  useEffect(() => {
    setPage(1);
    setExpandedService(null);
  }, [scope, mode, bookingSort]);
  const sortedGroups = useMemo(
    () =>
      [...(grouping.data?.groups ?? [])].sort((left, right) => {
        if (groupSort === 'service') return left.service.title.localeCompare(right.service.title);
        if (groupSort === 'date')
          return (left.nextStartDate ?? '9999').localeCompare(right.nextStartDate ?? '9999');
        return (
          right.bookingCount - left.bookingCount ||
          left.service.title.localeCompare(right.service.title)
        );
      }),
    [groupSort, grouping.data?.groups],
  );

  const beginConfirmation = (booking: IBooking) => {
    confirm.reset();
    setConfirming(booking);
    setStopBookings(false);
    setBlockStart(getBookingDateKey(booking.startDate));
    setBlockEnd(getBookingDateKey(booking.endDate));
  };
  const beginRejection = (booking: IBooking) => {
    reject.reset();
    setRejectionReason('');
    setRejecting(booking);
  };
  const beginCancellation = (booking: IBooking) => {
    cancel.reset();
    setCancellationReason('');
    setCancelling(booking);
  };
  const submitConfirmation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirming) return;
    confirm.mutate(
      {
        id: confirming.id,
        dto: stopBookings ? { blockDates: { startDate: blockStart, endDate: blockEnd } } : {},
      },
      { onSuccess: () => setConfirming(null) },
    );
  };
  const submitRejection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rejecting) return;
    reject.mutate(
      { id: rejecting.id, dto: { reason: rejectionReason } },
      {
        onSuccess: () => {
          setRejecting(null);
          setRejectionReason('');
        },
      },
    );
  };
  const submitCancellation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cancelling) return;
    cancel.mutate(
      { id: cancelling.id, dto: { reason: cancellationReason } },
      {
        onSuccess: () => {
          setCancelling(null);
          setCancellationReason('');
        },
      },
    );
  };
  const rowActions = {
    mutationPending,
    onConfirm: beginConfirmation,
    onReject: beginRejection,
    onCancel: beginCancellation,
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header admin-page-header--compact">
        <div>
          <span>RESERVATION WORKSPACE</span>
          <h1>Bookings</h1>
          <p>
            Review requests in date order or group them by service so one provider call can resolve
            several bookings.
          </p>
        </div>
      </header>

      <section className="admin-booking-workspace" aria-label="Booking workspace controls">
        <div className="admin-booking-scopes" role="tablist" aria-label="Booking period and status">
          {scopeOptions.map((option) => {
            const count = grouping.data?.counts[option.value];
            return (
              <button
                type="button"
                role="tab"
                aria-selected={scope === option.value}
                className={scope === option.value ? 'is-active' : ''}
                key={option.value}
                onClick={() => setScope(option.value)}
              >
                <span>
                  {option.label}
                  <b>{count ?? '—'}</b>
                </span>
                <small>{option.description}</small>
              </button>
            );
          })}
        </div>
        <div className="admin-booking-toolbar">
          <div className="admin-booking-mode" aria-label="Organize bookings">
            <button
              type="button"
              className={mode === 'bookings' ? 'is-active' : ''}
              onClick={() => setMode('bookings')}
            >
              <List /> By booking
            </button>
            <button
              type="button"
              className={mode === 'services' ? 'is-active' : ''}
              onClick={() => setMode('services')}
            >
              <Layers3 /> By service
            </button>
          </div>
          {mode === 'bookings' ? (
            <label>
              <span>Order</span>
              <select
                value={bookingSort}
                onChange={(event) => setBookingSort(event.target.value as BookingSort)}
              >
                <option value="newest">Newest request first</option>
                <option value="startAsc">Event date first</option>
                <option value="oldest">Oldest request first</option>
              </select>
            </label>
          ) : (
            <label>
              <span>Group order</span>
              <select
                value={groupSort}
                onChange={(event) => setGroupSort(event.target.value as GroupSort)}
              >
                <option value="volume">Most bookings first</option>
                <option value="date">Next event date</option>
                <option value="service">Service name A–Z</option>
              </select>
            </label>
          )}
        </div>
      </section>

      {((confirm.isError && !confirming) ||
        (reject.isError && !rejecting) ||
        (cancel.isError && !cancelling)) && (
        <p className="form-alert" role="alert">
          {getApiMessage(confirm.error ?? reject.error ?? cancel.error)}
        </p>
      )}
      {mode === 'bookings' ? (
        bookings.isLoading ? (
          <Spinner />
        ) : bookings.isError ? (
          <ErrorState message={getApiMessage(bookings.error)} />
        ) : bookings.data?.bookings.length ? (
          <>
            <div className="admin-booking-list">
              {bookings.data.bookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} {...rowActions} />
              ))}
            </div>
            <Pagination
              page={bookings.data.currentPage}
              totalPages={bookings.data.totalPages}
              onChange={(nextPage) => {
                setPage(nextPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              ariaLabel="Admin booking pages"
            />
          </>
        ) : (
          <EmptyState
            title={`No ${scope === 'all' ? '' : scope + ' '}bookings`}
            message="Try another filter or wait for a new request."
          />
        )
      ) : grouping.isLoading ? (
        <Spinner label="Organizing bookings by service" />
      ) : grouping.isError ? (
        <ErrorState message={getApiMessage(grouping.error)} />
      ) : sortedGroups.length ? (
        <div className="admin-service-booking-groups">
          {sortedGroups.map((group) => (
            <ServiceBookingGroup
              key={group.service.id}
              group={group}
              scope={scope}
              expanded={expandedService === group.service.id}
              onToggle={() =>
                setExpandedService((current) =>
                  current === group.service.id ? null : group.service.id,
                )
              }
              {...rowActions}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No services in this view" message="Choose another booking filter." />
      )}

      <Modal
        open={Boolean(confirming)}
        title="Confirm booking request"
        placement="center"
        onClose={() => {
          if (!confirm.isPending) {
            confirm.reset();
            setConfirming(null);
          }
        }}
      >
        {confirming && (
          <form className="booking-confirmation-form" onSubmit={submitConfirmation}>
            <div className="booking-confirmation-summary">
              <span>REQUESTED DATES</span>
              <h3>{getServiceTitle(confirming.service)}</h3>
              <p>
                <CalendarDays /> {formatBookingDate(confirming.startDate)} —{' '}
                {formatBookingDate(confirming.endDate)}
              </p>
            </div>
            <fieldset>
              <legend>
                After confirming, should customers still be able to request these dates?
              </legend>
              <label className={!stopBookings ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name="availability-action"
                  checked={!stopBookings}
                  onChange={() => setStopBookings(false)}
                />
                <span>
                  <strong>Keep accepting requests</strong>
                  <small>
                    Use this after verifying that another hall, room, or unit remains available.
                  </small>
                </span>
              </label>
              <label className={stopBookings ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name="availability-action"
                  checked={stopBookings}
                  onChange={() => setStopBookings(true)}
                />
                <CalendarOff />
                <span>
                  <strong>Stop new requests for selected dates</strong>
                  <small>
                    Use this when pooled inventory is exhausted. Existing requests can still be
                    reviewed manually.
                  </small>
                </span>
              </label>
            </fieldset>
            {stopBookings && (
              <div className="booking-confirmation-dates">
                <label>
                  <span>Block from</span>
                  <input
                    type="date"
                    min={getBookingDateKey(confirming.startDate)}
                    max={getBookingDateKey(confirming.endDate)}
                    value={blockStart}
                    onChange={(event) => {
                      const value = event.target.value;
                      setBlockStart(value);
                      if (blockEnd < value) setBlockEnd(value);
                    }}
                    required
                  />
                </label>
                <label>
                  <span>Block until</span>
                  <input
                    type="date"
                    min={blockStart || getBookingDateKey(confirming.startDate)}
                    max={getBookingDateKey(confirming.endDate)}
                    value={blockEnd}
                    onChange={(event) => setBlockEnd(event.target.value)}
                    required
                  />
                </label>
              </div>
            )}
            {confirm.isError && (
              <p className="form-alert" role="alert">
                {getApiMessage(confirm.error)}
              </p>
            )}
            <div className="booking-confirmation-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  confirm.reset();
                  setConfirming(null);
                }}
                disabled={confirm.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  confirm.isPending ||
                  (stopBookings && (!blockStart || !blockEnd || blockEnd < blockStart))
                }
              >
                {confirm.isPending
                  ? 'Confirming…'
                  : stopBookings
                    ? 'Confirm and block selected dates'
                    : 'Confirm booking'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        open={Boolean(rejecting)}
        title="Reject booking request"
        placement="center"
        onClose={() => {
          if (!reject.isPending) {
            reject.reset();
            setRejecting(null);
            setRejectionReason('');
          }
        }}
      >
        <form className="booking-rejection-form" onSubmit={submitRejection}>
          <p>
            Tell the customer why this request cannot be accepted. The reason appears in their
            bookings and is emailed to their contact address.
          </p>
          <label>
            <span>Reason for rejection</span>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              minLength={5}
              maxLength={500}
              rows={5}
              placeholder="For example: The venue is unavailable because of maintenance on these dates."
              autoFocus
              required
            />
          </label>
          {reject.isError && (
            <p className="form-alert" role="alert">
              {getApiMessage(reject.error)}
            </p>
          )}
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                reject.reset();
                setRejecting(null);
                setRejectionReason('');
              }}
              disabled={reject.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={reject.isPending || rejectionReason.trim().length < 5}
            >
              {reject.isPending ? 'Rejecting…' : 'Reject and notify customer'}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(cancelling)}
        title="Cancel confirmed booking"
        placement="center"
        onClose={() => {
          if (!cancel.isPending) {
            cancel.reset();
            setCancelling(null);
            setCancellationReason('');
          }
        }}
      >
        {cancelling && (
          <form className="booking-rejection-form" onSubmit={submitCancellation}>
            <p>
              This marks the confirmed booking as cancelled and emails the customer. Any blocked
              dates remain closed until you reopen them from service availability.
            </p>
            <label>
              <span>Reason for cancellation</span>
              <textarea
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                minLength={5}
                maxLength={500}
                rows={5}
                placeholder="For example: The provider can no longer fulfil this booking."
                autoFocus
                required
              />
            </label>
            {cancel.isError && (
              <p className="form-alert" role="alert">
                {getApiMessage(cancel.error)}
              </p>
            )}
            <div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  cancel.reset();
                  setCancelling(null);
                  setCancellationReason('');
                }}
                disabled={cancel.isPending}
              >
                Keep booking
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={cancel.isPending || cancellationReason.trim().length < 5}
              >
                {cancel.isPending ? 'Cancelling…' : 'Cancel and notify customer'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
