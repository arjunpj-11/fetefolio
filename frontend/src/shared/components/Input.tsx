import { forwardRef, type InputHTMLAttributes } from 'react';
interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}
export const Input = forwardRef<HTMLInputElement, IInputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="field" htmlFor={inputId}>
        <span className="field__label">{label}</span>
        <input
          ref={ref}
          id={inputId}
          className={`field__input ${error ? 'field__input--error' : ''} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <span className="field__error" id={`${inputId}-error`}>
            {error}
          </span>
        )}
      </label>
    );
  },
);
Input.displayName = 'Input';
