import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface IConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
  error?: string;
  tone?: 'danger' | 'default';
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  pending = false,
  error,
  tone = 'default',
}: IConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={pending ? () => undefined : onCancel}
      placement="center"
    >
      <div className="confirm-dialog">
        <span className={`confirm-dialog__icon ${tone === 'danger' ? 'is-danger' : ''}`}>
          <AlertTriangle />
        </span>
        <p>{message}</p>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-dialog__actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'Please wait…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
