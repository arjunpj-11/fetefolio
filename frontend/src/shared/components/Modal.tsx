import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
interface IModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  placement?: 'responsive' | 'center';
}
export function Modal({ open, title, onClose, children, placement = 'responsive' }: IModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div
      className={'modal-backdrop modal-backdrop--' + placement}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header>
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}
