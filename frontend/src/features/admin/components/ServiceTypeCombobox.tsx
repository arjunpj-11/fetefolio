import type { IServiceType } from '@programme/contracts';
import { Check, ChevronDown, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getApiMessage } from '../../../shared/api/axiosClient';

interface IServiceTypeComboboxProps {
  types: IServiceType[];
  value: string;
  error?: string;
  onChange: (slug: string) => void;
  onCreate: (name: string) => Promise<IServiceType>;
}

const normalize = (value: string): string => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');

export function ServiceTypeCombobox({
  types,
  value,
  error,
  onChange,
  onCreate,
}: IServiceTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = types.find((type) => type.slug === value);
  const normalizedQuery = normalize(query);
  const filtered = useMemo(
    () => types.filter((type) => normalize(type.label).includes(normalizedQuery)),
    [types, normalizedQuery],
  );
  const exactMatch = types.some((type) => normalize(type.label) === normalizedQuery);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const choose = (slug: string) => {
    onChange(slug);
    setOpen(false);
    setQuery('');
    setCreateError('');
  };
  const createType = async () => {
    if (normalizedQuery.length < 2 || exactMatch) return;
    setCreating(true);
    setCreateError('');
    try {
      choose((await onCreate(query.trim())).slug);
    } catch (mutationError: unknown) {
      setCreateError(getApiMessage(mutationError));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="field service-type-field" ref={rootRef}>
      <span>Service type</span>
      <button
        type="button"
        className={`service-type-trigger ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label ?? 'Select a service type'}</span>
        <ChevronDown />
      </button>
      {open && (
        <div className="service-type-menu">
          <label className="service-type-search">
            <Search />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCreateError('');
              }}
              placeholder="Search service types"
              aria-label="Search service types"
            />
          </label>
          <div className="service-type-options" role="listbox" aria-label="Service types">
            {filtered.map((type) => (
              <button
                type="button"
                role="option"
                aria-selected={value === type.slug}
                className={value === type.slug ? 'is-selected' : ''}
                key={type.id}
                onClick={() => choose(type.slug)}
              >
                <span>
                  <strong>{type.label}</strong>
                  <small>{type.description}</small>
                </span>
                {value === type.slug && <Check />}
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="service-type-empty">No matching service type found.</p>
          )}
          {normalizedQuery.length >= 2 && !exactMatch && (
            <button
              type="button"
              className="service-type-create"
              onClick={() => void createType()}
              disabled={creating}
            >
              <Plus />
              {creating ? 'Creating…' : `Create “${query.trim()}”`}
            </button>
          )}
          {createError && (
            <p className="service-type-error" role="alert">
              {createError}
            </p>
          )}
        </div>
      )}
      {error && <small className="field__error">{error}</small>}
    </div>
  );
}
