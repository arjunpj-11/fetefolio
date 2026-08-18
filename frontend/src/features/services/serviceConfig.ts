import type { IServiceType, ServiceCategory } from '@programme/contracts';

export interface IServiceCategoryConfig {
  label: string;
  singular: string;
  description: string;
  capacityLabel?: string;
  dateLabel: string;
}

const humanize = (category: string): string =>
  category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getServiceCategoryConfig = (
  category: ServiceCategory,
  serviceType?: IServiceType,
): IServiceCategoryConfig => {
  if (serviceType)
    return {
      label: serviceType.label,
      singular: serviceType.singular,
      description: serviceType.description,
      ...(serviceType.capacityLabel ? { capacityLabel: serviceType.capacityLabel } : {}),
      dateLabel: serviceType.dateLabel,
    };
  const label = humanize(category);
  return {
    label,
    singular: label.toLocaleLowerCase(),
    description: `${label} available for events and celebrations`,
    dateLabel: 'Event dates',
  };
};
