import { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils';
import type { InputHTMLAttributes } from 'react';

const fieldBase =
  'w-full rounded-[14px] border border-[var(--card-border)] bg-white/90 px-3 text-sm text-ink outline-none transition placeholder:text-kse-gray focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:bg-panel-dark dark:border-border-dark dark:text-white dark:placeholder:text-kse-gray';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink dark:text-brand-100">{label}</span>}
      <input
        ref={ref}
        id={inputId}
        className={cn(fieldBase, 'h-10', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20', className)}
        {...props}
      />
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(function PasswordInput(
  { label, error, className, id, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink dark:text-brand-100">{label}</span>}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cn(
            fieldBase,
            'h-10 pr-11',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-kse-gray transition hover:bg-kse-surface hover:text-ink dark:hover:bg-border-dark dark:hover:text-white"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
});

export function Textarea({
  label,
  error,
  className,
  ...props
}: { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink dark:text-brand-100">{label}</span>}
      <textarea
        className={cn(fieldBase, 'min-h-28 py-2', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20', className)}
        {...props}
      />
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  error,
  className,
  children,
  ...props
}: { label?: string; error?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink dark:text-brand-100">{label}</span>}
      <select
        className={cn(fieldBase, 'h-10', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20', className)}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}
