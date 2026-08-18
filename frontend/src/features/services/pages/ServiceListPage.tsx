import type { IServiceType, ServiceCategory, ServiceQueryDTO } from '@programme/contracts';
import { ArrowLeft, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { EmptyState, ErrorState } from '../../../shared/components/Feedback';
import { Pagination } from '../../../shared/components/Pagination';
import { Spinner } from '../../../shared/components/Spinner';
import { ServiceFilters } from '../components/ServiceFilters';
import { TicketCard } from '../components/TicketCard';
import { useServices, useServiceTypes } from '../hooks/useServices';
import { getServiceCategoryConfig } from '../serviceConfig';
import { useFilterStore, type IFilters, type SortOption } from '../store';

export function ServiceListPage() {
  const [searchParams] = useSearchParams();
  const serviceTypes = useServiceTypes();
  const rawCategory = searchParams.get('category');
  const serviceType = serviceTypes.data?.find((type) => type.slug === rawCategory);

  if (serviceTypes.isLoading) return <Spinner label="Loading service types" />;
  return rawCategory && serviceType ? (
    <CategoryServiceList category={rawCategory} serviceType={serviceType} />
  ) : (
    <Navigate to="/" replace />
  );
}

function CategoryServiceList({
  category,
  serviceType,
}: {
  category: ServiceCategory;
  serviceType: IServiceType;
}) {
  const filters = useFilterStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);
  const skipNextUrlSync = useRef(true);
  const urlState = searchParams.toString();
  useEffect(() => {
    skipNextUrlSync.current = true;
    filters.setFilter('category', category);
    filters.setFilter('search', searchParams.get('search') ?? '');
    filters.setFilter('city', searchParams.get('city') ?? '');
    const start = searchParams.get('startDate') ?? searchParams.get('date') ?? '';
    filters.setFilter('startDate', start);
    filters.setFilter('date', start);
    filters.setFilter('endDate', searchParams.get('endDate') ?? '');
    filters.setFilter('minPrice', searchParams.get('minPrice') ?? '');
    filters.setFilter('maxPrice', searchParams.get('maxPrice') ?? '');
    filters.setFilter('minRating', searchParams.get('minRating') ?? '');
    const requestedSort = searchParams.get('sort') as SortOption | null;
    const validSorts: SortOption[] = ['ratingDesc', 'newest', 'priceAsc', 'priceDesc', 'titleAsc'];
    filters.setFilter(
      'sort',
      requestedSort && validSorts.includes(requestedSort) ? requestedSort : 'newest',
    );
    const requestedPage = Number(searchParams.get('page') ?? 1);
    filters.setFilter(
      'page',
      Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    );
  }, [urlState, category]);
  useEffect(() => {
    if (skipNextUrlSync.current) {
      skipNextUrlSync.current = false;
      return;
    }
    const nextParams = new URLSearchParams();
    nextParams.set('category', category);
    if (filters.search) nextParams.set('search', filters.search);
    if (filters.city) nextParams.set('city', filters.city);
    if (filters.startDate) nextParams.set('startDate', filters.startDate);
    if (filters.endDate) nextParams.set('endDate', filters.endDate);
    if (filters.minPrice) nextParams.set('minPrice', filters.minPrice);
    if (filters.maxPrice) nextParams.set('maxPrice', filters.maxPrice);
    if (filters.minRating) nextParams.set('minRating', filters.minRating);
    if (filters.page > 1) nextParams.set('page', String(filters.page));
    if (filters.sort !== 'newest') nextParams.set('sort', filters.sort);
    if (nextParams.toString() !== urlState) setSearchParams(nextParams, { replace: true });
  }, [
    category,
    filters.city,
    filters.endDate,
    filters.maxPrice,
    filters.minPrice,
    filters.minRating,
    filters.page,
    filters.search,
    filters.sort,
    filters.startDate,
    setSearchParams,
    urlState,
  ]);
  const query: Partial<ServiceQueryDTO> = {
    category,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.minPrice ? { minPrice: Number(filters.minPrice) } : {}),
    ...(filters.maxPrice ? { maxPrice: Number(filters.maxPrice) } : {}),
    ...(filters.startDate ? { startDate: filters.startDate, date: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.minRating ? { minRating: Number(filters.minRating) } : {}),
    page: filters.page,
    limit: filters.limit,
    sort: filters.sort,
  };
  const services = useServices(query);
  const config = getServiceCategoryConfig(category, serviceType);
  const chips = [
    filters.search ? { key: 'search', label: `“${filters.search}”` } : null,
    filters.city ? { key: 'city', label: filters.city } : null,
    filters.startDate ? { key: 'startDate', label: `From ${filters.startDate}` } : null,
    filters.endDate ? { key: 'endDate', label: `Until ${filters.endDate}` } : null,
    filters.minRating ? { key: 'minRating', label: `${filters.minRating}★ & above` } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));
  const clearChip = (key: string) => filters.setFilter(key as keyof IFilters, '');

  return (
    <section className="catalog-page">
      <header className="catalog-hero">
        <div>
          <Link to="/">
            <ArrowLeft /> Back to homepage
          </Link>
          <span>
            <Sparkles /> MATCHED TO YOUR DATES
          </span>
          <h1>{config.label}</h1>
          <p>
            {config.description}. Compare transparent rates, ratings and provider-managed
            availability.
          </p>
        </div>
        <div className="catalog-hero__stat">
          <strong>{services.data?.totalCount ?? '—'}</strong>
          <span>available options</span>
        </div>
      </header>
      <div className="catalog-layout">
        <aside className="catalog-filter-column">
          <ServiceFilters category={category} serviceType={serviceType} />
        </aside>
        <main className="catalog-results">
          <div className="mmt-toolbar">
            <div className="mmt-results-count">
              <strong>{services.data?.totalCount ?? '—'}</strong>
              <span>{config.label.toLowerCase()} found</span>
            </div>
            <div className="catalog-toolbar-actions">
              <button className="mobile-filter-button" onClick={() => setMobileFilters(true)}>
                <SlidersHorizontal /> Filters
              </button>
              <label className="mmt-sort-control">
                <span>Sort</span>
                <select
                  value={filters.sort}
                  onChange={(event) => filters.setFilter('sort', event.target.value as SortOption)}
                >
                  <option value="ratingDesc">Top rated</option>
                  <option value="newest">Newest</option>
                  <option value="priceAsc">Price: low to high</option>
                  <option value="priceDesc">Price: high to low</option>
                  <option value="titleAsc">Name: A–Z</option>
                </select>
              </label>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="mmt-chips-row">
              {chips.map((chip) => (
                <button key={chip.key} onClick={() => clearChip(chip.key)} className="mmt-chip">
                  {chip.label}
                  <X />
                </button>
              ))}
            </div>
          )}
          {services.isLoading ? (
            <Spinner label={`Finding ${config.label.toLowerCase()}…`} />
          ) : services.isError ? (
            <ErrorState
              message={getApiMessage(services.error)}
              onRetry={() => void services.refetch()}
            />
          ) : services.data?.services.length ? (
            <div className="mmt-cards-feed">
              {services.data.services.map((service, index) => (
                <TicketCard
                  key={service.id}
                  service={service}
                  serviceType={serviceType}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No ${config.label.toLowerCase()} match`}
              message="Adjust the dates, city, price or service-specific filters."
            />
          )}
          <Pagination
            page={filters.page}
            totalPages={services.data?.totalPages ?? 0}
            onChange={(page) => {
              filters.setFilter('page', page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
      </div>
      {mobileFilters && (
        <>
          <button
            className="filter-drawer-backdrop"
            onClick={() => setMobileFilters(false)}
            aria-label="Close filters"
          />
          <ServiceFilters
            category={category}
            serviceType={serviceType}
            mobileOpen
            onClose={() => setMobileFilters(false)}
          />
        </>
      )}
    </section>
  );
}
