import { forwardRef, useState, InputHTMLAttributes } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  required?: boolean;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, required, className = '', id, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const inputId = id ?? 'password-input';

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
            {required && <span className="text-amber-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={show ? 'text' : 'password'}
            className={`
              w-full px-4 py-2.5 pr-11 rounded-xl border bg-white/5 text-slate-100 text-sm
              outline-none transition-all duration-200 placeholder:text-slate-500
              ${error
                ? 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                : 'border-white/10 focus:border-amber-500 focus:shadow-[0_0_12px_rgba(139,92,246,0.25)]'
              }
              ${className}
            `}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
