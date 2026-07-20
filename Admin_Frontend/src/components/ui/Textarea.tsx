import { TextareaHTMLAttributes, forwardRef } from 'react';
import './Input.css'; // Re-use input styles for consistency

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`input-group ${error ? 'input-group--error' : ''}`}>
        {label && (
          <label className="input-label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className="input-wrapper">
          <textarea
            ref={ref}
            id={inputId}
            className={`input-field ${className}`}
            style={{ minHeight: '100px', resize: 'vertical', paddingTop: '12px' }}
            {...props}
          />
        </div>
        {error && <span className="input-error">{error}</span>}
        {hint && !error && <span className="input-hint">{hint}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
