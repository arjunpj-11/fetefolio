import type { IService, IServiceType } from '@programme/contracts';
import { ArrowUpRight, ImageOff, MapPin, Star, Users } from 'lucide-react';
import { type CSSProperties, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatCurrency } from '../../../shared/utils/formatters';
import { getServiceCategoryConfig } from '../serviceConfig';

export function TicketCard({
  service,
  serviceType,
  index = 0,
}: {
  service: IService;
  serviceType?: IServiceType;
  index?: number;
}) {
  const location = useLocation();
  const style = { '--ticket-delay': `${Math.min(index, 8) * 45}ms` } as CSSProperties;
  const rating = service.rating ?? 4.8;
  const [imageFailed, setImageFailed] = useState(false);
  const detailLinkState = { serviceListReturnTo: `${location.pathname}${location.search}` };

  return (
    <article className="mmt-card-item" style={style}>
      {/* Left Thumbnail Image */}
      <Link
        to={`/services/${service.id}`}
        state={detailLinkState}
        className="mmt-card-item__img-wrap"
        aria-label={service.title}
      >
        {service.images[0] && !imageFailed ? (
          <img
            src={service.images[0]}
            alt={service.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="mmt-card-item__placeholder service-image-fallback">
            <ImageOff />
            <span>Photo coming soon</span>
          </div>
        )}
        <span className="mmt-card-item__cat">
          {getServiceCategoryConfig(service.category, serviceType).singular}
        </span>
      </Link>

      {/* Center Details Body */}
      <div className="mmt-card-item__body">
        <div className="mmt-card-item__header">
          <div>
            <h2 className="mmt-card-item__title">
              <Link to={`/services/${service.id}`} state={detailLinkState}>
                {service.title}
              </Link>
            </h2>
            <span className="mmt-card-item__location">
              <MapPin className="mmt-location-icon" />
              {service.location.address}, {service.location.city}, {service.location.state}
            </span>
          </div>

          {/* Rating Badge */}
          <div className="mmt-card-item__rating-badge">
            <div className="mmt-rating-score">
              <Star className="mmt-star-icon" />
              <strong>{rating.toFixed(1)}</strong>
              <small>/5</small>
            </div>
          </div>
        </div>

        <p className="mmt-card-item__desc">{service.description}</p>

        <div className="mmt-card-item__tags">
          {service.capacity && (
            <span className="mmt-tag">
              <Users className="mmt-capacity-icon" />
              Up to {service.capacity} Guests
            </span>
          )}
          <span
            className={`mmt-tag ${service.isAvailable === false ? 'mmt-tag--unavailable' : 'mmt-tag--available'}`}
          >
            {service.isAvailable === false ? 'Booked for dates' : 'Available for booking'}
          </span>
        </div>
      </div>

      {/* Right Pricing & Action Stub */}
      <div className="mmt-card-item__action-stub">
        <div className="mmt-card-item__price-block">
          <span className="mmt-price-label">Price per day</span>
          <strong className="mmt-price-val">{formatCurrency(service.pricePerDay)}</strong>
          <small className="mmt-tax-note">Transparent daily rate</small>
        </div>

        <Link
          to={`/services/${service.id}`}
          state={detailLinkState}
          className="mmt-view-btn"
          aria-label={'More details about ' + service.title}
        >
          VIEW DETAILS <ArrowUpRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </article>
  );
}
