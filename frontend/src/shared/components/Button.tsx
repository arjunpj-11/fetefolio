import type { ButtonHTMLAttributes, ReactNode } from 'react';
interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
}
export function Button({ variant = 'primary', className = '', children, ...props }: IButtonProps) {
  return (
    <button className={`button button--${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
