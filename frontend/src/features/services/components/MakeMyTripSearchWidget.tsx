import type { ServiceCategory } from '@programme/contracts';
import { format } from 'date-fns';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFilterStore } from '../store';
import { useAvailableServiceTypes } from '../hooks/useServices';
import { getServiceTypeIcon } from './ServiceTypeIcon';

export function MakeMyTripSearchWidget() {
  const navigate = useNavigate();
  const filters = useFilterStore();

  const [activeTab, setActiveTab] = useState<ServiceCategory | ''>(filters.category || '');
  const [city, setCity] = useState(filters.city || '');
  const [startDate, setStartDate] = useState(filters.startDate || filters.date || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [priceBudget, setPriceBudget] = useState(
    filters.maxPrice
      ? Number(filters.maxPrice) <= 50000
        ? 'under50k'
        : Number(filters.maxPrice) <= 150000
          ? '50k150k'
          : 'above150k'
      : '',
  );
  const serviceTypes = useAvailableServiceTypes(startDate, endDate);
  const tabs = serviceTypes.data ?? [];

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some((type) => type.slug === activeTab))
      setActiveTab(tabs[0].slug);
  }, [activeTab, tabs]);

  const handleTabChange = (tabId: ServiceCategory) => {
    setActiveTab(tabId);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const submitted = new FormData(e.currentTarget as HTMLFormElement);
    const submittedCity = String(submitted.get('city') ?? '').trim();
    const submittedStart = String(submitted.get('startDate') ?? '');
    const submittedEnd = String(submitted.get('endDate') ?? '');
    const submittedBudget = String(submitted.get('priceBudget') ?? '');

    filters.setFilter('category', activeTab || undefined);
    filters.setFilter('city', submittedCity);
    filters.setFilter('startDate', submittedStart);
    filters.setFilter('endDate', submittedEnd);
    filters.setFilter('date', submittedStart);

    if (submittedBudget === 'under50k') {
      filters.setFilter('minPrice', '');
      filters.setFilter('maxPrice', '50000');
    } else if (submittedBudget === '50k150k') {
      filters.setFilter('minPrice', '50000');
      filters.setFilter('maxPrice', '150000');
    } else if (submittedBudget === 'above150k') {
      filters.setFilter('minPrice', '150000');
      filters.setFilter('maxPrice', '');
    } else {
      filters.setFilter('minPrice', '');
      filters.setFilter('maxPrice', '');
    }

    const params = new URLSearchParams();
    if (activeTab) params.set('category', activeTab);
    if (submittedCity) params.set('city', submittedCity);
    if (submittedStart) params.set('startDate', submittedStart);
    if (submittedEnd) params.set('endDate', submittedEnd);
    if (submittedBudget === 'under50k') params.set('maxPrice', '50000');
    if (submittedBudget === '50k150k') {
      params.set('minPrice', '50000');
      params.set('maxPrice', '150000');
    }
    if (submittedBudget === 'above150k') params.set('minPrice', '150000');

    const query = params.toString();
    void navigate(query ? `/services?${query}` : '/services');
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activeType = tabs.find((type) => type.slug === activeTab);

  return (
    <div className="mmt-widget">
      <div className="mmt-tabs" role="tablist" aria-label="Service categories">
        {tabs.length === 0 && !serviceTypes.isLoading && (
          <div className="mmt-tabs__empty">
            <strong>No service types available</strong>
            <span>Try another date or check back later.</span>
          </div>
        )}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.slug;
          const Icon = getServiceTypeIcon(tab.icon);
          return (
            <button
              key={tab.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`mmt-tab ${isActive ? 'mmt-tab--active' : ''}`}
              onClick={() => handleTabChange(tab.slug)}
            >
              <span className="mmt-tab__icon">
                <Icon className="w-5 h-5" />
              </span>
              <div className="mmt-tab__text">
                <span className="mmt-tab__title">{tab.label}</span>
                <span className="mmt-tab__sub">{tab.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSearch} className="mmt-card">
        <div className="mmt-grid mmt-grid--compact">
          <div className="mmt-box">
            <span className="mmt-box__label">
              <MapPin className="mmt-box__icon" /> CITY, LOCATION OR PROPERTY
            </span>
            <input
              type="text"
              name="city"
              className="mmt-box__input"
              aria-label="Destination city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Jaipur, Goa, Udaipur, Delhi"
            />
            <span className="mmt-box__hint">Destination city</span>
          </div>

          <div className="mmt-box">
            <span className="mmt-box__label">
              <CalendarDays className="mmt-box__icon" /> CHECK-IN / EVENT DATE
            </span>
            <input
              type="date"
              name="startDate"
              className="mmt-box__input"
              min={todayStr}
              value={startDate}
              onChange={(e) => {
                const value = e.target.value;
                setStartDate(value);
                filters.setFilter('startDate', value);
                filters.setFilter('date', value);
                if (endDate && value > endDate) {
                  setEndDate('');
                  filters.setFilter('endDate', '');
                }
              }}
            />
            <span className="mmt-box__hint">Select start date</span>
          </div>

          <div className="mmt-box">
            <span className="mmt-box__label">
              <CalendarDays className="mmt-box__icon" /> CHECK-OUT DATE
            </span>
            <input
              type="date"
              name="endDate"
              className="mmt-box__input"
              min={startDate || todayStr}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                filters.setFilter('endDate', e.target.value);
              }}
            />
            <span className="mmt-box__hint">Select end date</span>
          </div>

          <div className="mmt-box">
            <span className="mmt-box__label">PRICE PER DAY</span>
            <select
              name="priceBudget"
              className="mmt-box__select"
              value={priceBudget}
              onChange={(e) => setPriceBudget(e.target.value)}
            >
              <option value="">Any Price</option>
              <option value="under50k">Under ₹50,000 / day</option>
              <option value="50k150k">₹50,000 - ₹1,50,000 / day</option>
              <option value="above150k">Above ₹1,50,000 / day</option>
            </select>
            <span className="mmt-box__hint">Select price range</span>
          </div>
        </div>

        <div className="mmt-action">
          <button type="submit" className="mmt-search-btn" disabled={tabs.length === 0}>
            <Search className="w-5 h-5 mr-2" />
            {tabs.length > 0
              ? `SHOW ${(activeType?.label ?? 'AVAILABLE SERVICES').toUpperCase()}`
              : 'NO SERVICES AVAILABLE'}
          </button>
        </div>
      </form>
    </div>
  );
}
