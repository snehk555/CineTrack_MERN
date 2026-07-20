import { ButtonHTMLAttributes } from 'react';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variantClasses = {
  primary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40',
  secondary: 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10',
  danger: 'bg-red-600/80 hover:bg-red-600 text-white',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export default function Button({
  isLoading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled ?? isLoading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
