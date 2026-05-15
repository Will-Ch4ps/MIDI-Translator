import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import './Input.css';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon?: ReactNode;
  suffix?: ReactNode;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, suffix, invalid, className, ...rest },
  ref,
) {
  return (
    <div className={clsx('ui-input', invalid && 'ui-input--invalid', className)}>
      {icon ? <span className="ui-input__icon">{icon}</span> : null}
      <input ref={ref} {...rest} />
      {suffix ? <span className="ui-input__suffix">{suffix}</span> : null}
    </div>
  );
});

export type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
};

export function Field({ label, hint, error, required, children }: FieldProps) {
  return (
    <label className="ui-field">
      {label ? (
        <span className="ui-field__label">
          {label}
          {required ? <span className="ui-field__required">*</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <span className="ui-field__error">{error}</span> : null}
      {!error && hint ? <span className="ui-field__hint">{hint}</span> : null}
    </label>
  );
}
