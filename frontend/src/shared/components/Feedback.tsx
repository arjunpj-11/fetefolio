import { AlertTriangle, SearchX } from 'lucide-react';
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="feedback feedback--error" role="alert">
      <AlertTriangle />
      <div>
        <strong>We missed a cue.</strong>
        <p>{message}</p>
        {onRetry && (
          <button className="feedback__retry" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="feedback">
      <SearchX />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
