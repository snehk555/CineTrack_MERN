import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import './Input.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`input-group ${error ? 'input-group--error' : ''}`}>
        {label && (
          <label className="input-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className="input-wrapper">
          {prefix && <span className="input-prefix">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`input-field ${prefix ? 'input-field--prefix' : ''} ${
              suffix ? 'input-field--suffix' : ''
            } ${className}`}
            {...props}
          />
          {suffix && <span className="input-suffix">{suffix}</span>}
        </div>
        {error && <span className="input-error">{error}</span>}
        {hint && !error && <span className="input-hint">{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
