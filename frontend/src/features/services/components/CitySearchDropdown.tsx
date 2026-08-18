import { Check, ChevronDown, MapPin, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

const majorCityOrder = ['Delhi', 'Mumbai', 'Bengaluru', 'Jaipur', 'Goa', 'Udaipur'];

interface ICitySearchDropdownProps {
  cities: string[];
  value: string;
  isLoading?: boolean;
  onChange: (city: string) => void;
}

export function CitySearchDropdown({
  cities,
  value,
  isLoading = false,
  onChange,
}: ICitySearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const uniqueCities = useMemo(
    () => [...new Set(cities)].sort((a, b) => a.localeCompare(b)),
    [cities],
  );
  const popularCities = useMemo(
    () =>
      [...uniqueCities]
        .sort((a, b) => {
          const aIndex = majorCityOrder.indexOf(a);
          const bIndex = majorCityOrder.indexOf(b);
          if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        })
        .slice(0, 6),
    [uniqueCities],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleCities = normalizedQuery
    ? uniqueCities.filter((city) => city.toLocaleLowerCase().includes(normalizedQuery))
    : popularCities;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        rootRef.current?.querySelector<HTMLButtonElement>('.city-picker__trigger')?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const closeAndSelect = (city: string) => {
    onChange(city);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="city-picker" ref={rootRef}>
      <button
        type="button"
        className={`city-picker__trigger ${isOpen ? 'is-open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => {
          setIsOpen((open) => !open);
          if (isOpen) setQuery('');
        }}
      >
        <span>
          <MapPin />
          {value || 'Every city'}
        </span>
        <ChevronDown className="city-picker__chevron" />
      </button>

      {isOpen && (
        <div className="city-picker__dropdown">
          <label className="city-picker__search">
            <Search />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a city"
              aria-label="Search cities"
              autoComplete="off"
            />
          </label>

          {!normalizedQuery && <p className="city-picker__heading">Popular cities</p>}
          <div
            id={listboxId}
            className="city-picker__options"
            role="listbox"
            aria-label="Available cities"
          >
            {!normalizedQuery && (
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={!value ? 'is-selected' : ''}
                onClick={() => closeAndSelect('')}
              >
                <span>Every city</span>
                {!value && <Check />}
              </button>
            )}
            {visibleCities.map((city) => (
              <button
                type="button"
                role="option"
                aria-selected={value === city}
                className={value === city ? 'is-selected' : ''}
                key={city}
                onClick={() => closeAndSelect(city)}
              >
                <span>{city}</span>
                {value === city && <Check />}
              </button>
            ))}
          </div>

          {isLoading && <p className="city-picker__status">Loading cities…</p>}
          {!isLoading && visibleCities.length === 0 && (
            <div className="city-picker__empty" role="status">
              <MapPin />
              <strong>No cities found</strong>
              <span>This city isn’t available right now. We’ll add more cities later.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
