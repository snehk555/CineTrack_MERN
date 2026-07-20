import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
            {required && <span className="text-amber-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5 rounded-xl border bg-white/5 text-slate-100 text-sm
            outline-none transition-all duration-200 placeholder:text-slate-500
            ${error
              ? 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.2)]'
              : 'border-white/10 focus:border-amber-500 focus:shadow-[0_0_12px_rgba(139,92,246,0.25)]'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
