import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
export function Pagination({
  page,
  totalPages,
  onChange,
  ariaLabel = 'Services pages',
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  ariaLabel?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label={ariaLabel}>
      <Button
        variant="ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} /> Previous
      </Button>
      <span className="pagination__status">
        PAGE {page.toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}
      </span>
      <Button variant="ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next <ChevronRight size={18} />
      </Button>
    </nav>
  );
}
