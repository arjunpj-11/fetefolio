import type { ServiceTypeIconName } from '@programme/contracts';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  getServiceTypeIcon,
  serviceTypeIconOptions,
} from '../../services/components/ServiceTypeIcon';

interface IServiceTypeIconPickerProps {
  value: ServiceTypeIconName;
  onChange: (value: ServiceTypeIconName) => void;
}

export function ServiceTypeIconPicker({ value, onChange }: IServiceTypeIconPickerProps) {
  const [open, setOpen] = useState(false);
  const selected =
    serviceTypeIconOptions.find((option) => option.value === value) ?? serviceTypeIconOptions[0];
  const SelectedIcon = getServiceTypeIcon(selected?.value);
  return (
    <div className="service-type-icon-picker">
      <span>Service type symbol</span>
      <button
        type="button"
        className="service-type-icon-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <SelectedIcon />
        <strong>{selected?.label ?? 'General service'}</strong>
        <ChevronDown />
      </button>
      {open && (
        <div className="service-type-icon-menu" role="listbox" aria-label="Service type symbols">
          {serviceTypeIconOptions.map((option) => {
            const Icon = option.icon;
            const active = option.value === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={active}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Icon />
                <span>{option.label}</span>
                {active && <Check />}
              </button>
            );
          })}
        </div>
      )}
      <small>
        New service types start with the general symbol. You can customize them here at any time.
      </small>
    </div>
  );
}
