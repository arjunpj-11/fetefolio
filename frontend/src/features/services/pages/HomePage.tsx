import type { IService, IServiceType } from '@programme/contracts';
import { ChevronRight, ImageOff, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { EmptyState, ErrorState } from '../../../shared/components/Feedback';
import { Spinner } from '../../../shared/components/Spinner';
import { formatCurrency } from '../../../shared/utils/formatters';
import { MakeMyTripSearchWidget } from '../components/MakeMyTripSearchWidget';
import { ServiceCategoryCards } from '../components/ServiceCategoryCards';
import { useAvailableServiceTypes, useServices } from '../hooks/useServices';
import { getServiceCategoryConfig } from '../serviceConfig';
import { useFilterStore } from '../store';

function ServicePreviewCard({
  service,
  serviceType,
}: {
  service: IService;
  serviceType?: IServiceType;
}) {
  const rating = service.rating ?? 4.8;
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="service-preview-card">
      <Link
        className="service-preview-card__image"
        to={'/services/' + service.id}
        aria-label={'Open ' + service.title}
      >
        {service.images[0] && !imageFailed ? (
          <img
            src={service.images[0]}
            alt={service.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="service-image-fallback">
            <ImageOff />
            <small>Photo coming soon</small>
          </span>
        )}
        <i>{getServiceCategoryConfig(service.category, serviceType).label}</i>
      </Link>
      <div className="service-preview-card__body">
        <div className="flex justify-between items-center mb-1">
          <span>{service.location.city}</span>
          <span className="service-preview-card__rating">
            <Star />
            {rating.toFixed(1)}
          </span>
        </div>
        <h3>
          <Link to={'/services/' + service.id}>{service.title}</Link>
        </h3>
        <div>
          <strong>{formatCurrency(service.pricePerDay)}</strong>
          <small>/ day</small>
        </div>
        <Link className="service-preview-card__more" to={'/services/' + service.id}>
          More details <ChevronRight />
        </Link>
      </div>
    </article>
  );
}

function DiscoverySection({
  title,
  subtitle,
  types,
  startDate,
  endDate,
}: {
  title: string;
  subtitle: string;
  types: IServiceType[];
  startDate: string;
  endDate: string;
}) {
  const query = useServices({
    ...(startDate ? { startDate, date: startDate } : {}),
    ...(endDate ? { endDate } : {}),
    page: 1,
    limit: 4,
    sort: 'newest',
  });
  return (
    <section className="home-service-section">
      <div className="home-section-heading">
        <div>
          <span>{subtitle}</span>
          <h2>{title}</h2>
        </div>
        <a href="#service-categories">
          Browse categories <ChevronRight />
        </a>
      </div>
      {query.isLoading ? (
        <Spinner label={'Loading ' + title} />
      ) : query.isError ? (
        <ErrorState message={getApiMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : query.data?.services.length ? (
        <div className="service-preview-grid">
          {query.data.services.map((service) => (
            <ServicePreviewCard
              key={service.id}
              service={service}
              serviceType={types.find((type) => type.slug === service.category)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="This section is being prepared"
          message="New services will appear here as providers publish them."
        />
      )}
    </section>
  );
}

export function HomePage() {
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const serviceTypes = useAvailableServiceTypes(startDate, endDate);
  const types = serviceTypes.data ?? [];
  return (
    <>
      <section className="discovery-hero discovery-hero--mmt">
        <div className="discovery-hero__header text-center">
          <span className="eyebrow">
            <Sparkles /> DISCOVER AVAILABLE EVENT SERVICES
          </span>
          <h1>
            Everything your celebration needs, <em>all in one search.</em>
          </h1>
        </div>

        <MakeMyTripSearchWidget />
      </section>

      <section className="category-entry" id="service-categories">
        <div className="home-section-heading">
          <div>
            <span>EXPLORE CATEGORIES</span>
            <h2>What are you planning today?</h2>
          </div>
        </div>
        <ServiceCategoryCards />
      </section>

      <DiscoverySection
        title="Fresh on Fetefolio"
        subtitle="NEWLY LISTED"
        types={types}
        startDate={startDate}
        endDate={endDate}
      />

      <section className="home-promise">
        <span>THE FETEFOLIO PROMISE</span>
        <h2>Clear dates. Clear totals. Better choices.</h2>
        <a className="button button--primary" href="#service-categories">
          Start discovering <ChevronRight />
        </a>
      </section>
    </>
  );
}
