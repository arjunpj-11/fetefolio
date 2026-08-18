import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../shared/components/Feedback';
import { Spinner } from '../../../shared/components/Spinner';
import { useAvailableServiceTypes } from '../hooks/useServices';
import { useFilterStore } from '../store';
import { getServiceTypeIcon } from './ServiceTypeIcon';

export function ServiceCategoryCards() {
  const startDate = useFilterStore((state) => state.startDate);
  const endDate = useFilterStore((state) => state.endDate);
  const serviceTypes = useAvailableServiceTypes(startDate, endDate);
  const types = serviceTypes.data ?? [];
  if (serviceTypes.isLoading) return <Spinner label="Loading available service types" />;
  if (types.length === 0)
    return (
      <EmptyState
        title="No service types available"
        message="There are no active services available for these dates yet. Try another date or check back later."
      />
    );
  const gridCount = types.length <= 6 ? String(types.length) : 'many';

  return (
    <div className="category-entry__grid" data-count={gridCount}>
      {types.map((category, index) => {
        const Icon = getServiceTypeIcon(category.icon);
        const params = new URLSearchParams({ category: category.slug });
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        return (
          <Link
            key={category.slug}
            className="category-entry-card"
            to={`/services?${params.toString()}`}
            aria-label={`View ${category.label}`}
          >
            <span className="category-entry-card__number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <i>
              <Icon aria-hidden="true" />
            </i>
            <small>{category.singular}</small>
            <h3>{category.label}</h3>
            <p>{category.description}</p>
            <b>
              View {category.label} <ChevronRight aria-hidden="true" />
            </b>
          </Link>
        );
      })}
    </div>
  );
}
