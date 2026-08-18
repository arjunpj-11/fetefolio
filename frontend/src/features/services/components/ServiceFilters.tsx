import type { IServiceType, ServiceCategory } from '@programme/contracts';
import { format } from 'date-fns';
import { CalendarDays, RotateCcw, Search, Star, X } from 'lucide-react';
import { getServiceCategoryConfig } from '../serviceConfig';
import { useServiceFilterMetadata } from '../hooks/useServices';
import { useFilterStore } from '../store';
import { CitySearchDropdown } from './CitySearchDropdown';

interface IServiceFiltersProps {
  category: ServiceCategory;
  serviceType: IServiceType;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function ServiceFilters({
  category,
  serviceType,
  mobileOpen = false,
  onClose,
}: IServiceFiltersProps) {
  const filters = useFilterStore();
  const metadata = useServiceFilterMetadata(category);
  const config = getServiceCategoryConfig(category, serviceType);
  const today = format(new Date(), 'yyyy-MM-dd');
  const resetAll = () => {
    filters.setFilter('search', '');
    filters.setFilter('city', '');
    filters.setFilter('minPrice', '');
    filters.setFilter('maxPrice', '');
    filters.setFilter('date', '');
    filters.setFilter('startDate', '');
    filters.setFilter('endDate', '');
    filters.setFilter('minRating', '');
  };
  const activeCount = [
    filters.search,
    filters.city,
    filters.minPrice,
    filters.maxPrice,
    filters.startDate,
    filters.endDate,
    filters.minRating,
  ].filter(Boolean).length;

  return (
    <aside
      className={`mmt-sidebar-filters ${mobileOpen ? 'is-mobile-open' : ''}`}
      aria-label={`${config.label} filters`}
    >
      <div className="mmt-sidebar-filters__header">
        <div>
          <h3 className="mmt-sidebar-filters__title">Refine {config.label.toLowerCase()}</h3>
          {activeCount > 0 && (
            <span className="mmt-sidebar-filters__badge">{activeCount} active</span>
          )}
        </div>
        <div className="filter-header-actions">
          {activeCount > 0 && (
            <button type="button" onClick={resetAll} className="mmt-sidebar-filters__reset">
              <RotateCcw /> Clear
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="filter-mobile-close"
              onClick={onClose}
              aria-label="Close filters"
            >
              <X />
            </button>
          )}
        </div>
      </div>

      <div className="mmt-filter-section">
        <h4 className="mmt-filter-section__title">Keyword</h4>
        <label className="city-picker__search">
          <Search />
          <input
            type="search"
            aria-label="Search services by keyword"
            value={filters.search}
            onChange={(event) => filters.setFilter('search', event.target.value)}
            maxLength={100}
            placeholder="Name or description"
          />
        </label>
      </div>

      <div className="mmt-filter-section mmt-filter-section--city">
        <h4 className="mmt-filter-section__title">City</h4>
        <CitySearchDropdown
          cities={metadata.data?.cities ?? []}
          value={filters.city}
          isLoading={metadata.isLoading}
          onChange={(city) => filters.setFilter('city', city)}
        />
      </div>

      <div className="mmt-filter-section">
        <h4 className="mmt-filter-section__title">{config.dateLabel}</h4>
        <div className="mmt-date-group">
          <label className="mmt-field">
            <span className="mmt-field__label">From</span>
            <div className="mmt-date-input-wrap">
              <CalendarDays />
              <input
                type="date"
                min={today}
                value={filters.startDate}
                onChange={(event) => {
                  const value = event.target.value;
                  filters.setFilter('startDate', value);
                  filters.setFilter('date', value);
                  if (filters.endDate && value > filters.endDate) {
                    filters.setFilter('endDate', '');
                  }
                }}
              />
            </div>
          </label>
          <label className="mmt-field">
            <span className="mmt-field__label">Until</span>
            <div className="mmt-date-input-wrap">
              <CalendarDays />
              <input
                type="date"
                min={filters.startDate || today}
                value={filters.endDate}
                onChange={(event) => filters.setFilter('endDate', event.target.value)}
              />
            </div>
          </label>
        </div>
      </div>

      <div className="mmt-filter-section">
        <h4 className="mmt-filter-section__title">Price per day</h4>
        <div className="mmt-price-inputs">
          <label className="mmt-field">
            <span className="mmt-field__label">Minimum ₹</span>
            <input
              inputMode="numeric"
              className="mmt-field__input"
              value={filters.minPrice}
              onChange={(event) =>
                filters.setFilter('minPrice', event.target.value.replace(/\D/g, ''))
              }
              placeholder="0"
            />
          </label>
          <label className="mmt-field">
            <span className="mmt-field__label">Maximum ₹</span>
            <input
              inputMode="numeric"
              className="mmt-field__input"
              value={filters.maxPrice}
              onChange={(event) =>
                filters.setFilter('maxPrice', event.target.value.replace(/\D/g, ''))
              }
              placeholder="Any"
            />
          </label>
        </div>
      </div>

      <div className="mmt-filter-section">
        <h4 className="mmt-filter-section__title">Rating</h4>
        <div className="mmt-rating-options">
          {['4.5', '4.0', '3.5'].map((rating) => (
            <button
              type="button"
              key={rating}
              className={filters.minRating === rating ? 'is-active' : ''}
              onClick={() =>
                filters.setFilter('minRating', filters.minRating === rating ? '' : rating)
              }
            >
              <Star /> {rating} & above
            </button>
          ))}
        </div>
      </div>

      {onClose && (
        <button type="button" className="filter-mobile-apply" onClick={onClose}>
          Show results
        </button>
      )}
    </aside>
  );
}
