import { cn } from '../../utils';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

const variants = {
  primary:
    'bg-brand-400 text-inverse-fg hover:bg-brand-300 border border-brand-400 shadow-[var(--glow)] focus-visible:ring-brand-400/40',
  secondary:
    'bg-panel/80 text-ink border border-[var(--card-border)] hover:bg-brand-50 dark:bg-panel-dark dark:text-white dark:border-border-dark dark:hover:bg-brand-800/40 focus-visible:ring-brand-400/25',
  ghost:
    'bg-transparent text-kse-muted hover:bg-brand-50 hover:text-ink dark:text-kse-gray dark:hover:bg-border-dark/60 dark:hover:text-white focus-visible:ring-brand-400/20',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-400/40',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[14px] font-semibold tracking-tight transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-panel-dark',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
