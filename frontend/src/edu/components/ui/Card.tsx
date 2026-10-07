import { cn, resolveMediaUrl } from '../../utils';
import type { PropsWithChildren } from 'react';

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'rounded-kse border border-[var(--card-border)] bg-panel/92 shadow-[var(--shadow)] backdrop-blur-sm dark:bg-panel-dark/88 dark:border-border-dark',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'slate',
}: PropsWithChildren<{ tone?: 'slate' | 'green' | 'amber' | 'rose' | 'teal' }>) {
  const tones = {
    slate: 'bg-kse-surface text-kse-muted dark:bg-border-dark dark:text-kse-gray',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    teal: 'bg-brand-50 text-brand-700 dark:bg-brand-800/40 dark:text-brand-200',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide', tones[tone])}>
      {children}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-kse-border dark:bg-border-dark">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-brand-100/70 dark:bg-border-dark', className)} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-kse-border bg-panel px-6 py-16 text-center dark:bg-panel-dark dark:border-border-dark">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-800/40">
        <span className="text-lg font-bold">∅</span>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-ink dark:text-white">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-kse-muted dark:text-kse-gray">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.045em] text-ink dark:text-white">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-kse-muted dark:text-kse-gray">{description}</p>}
      </div>
      {actions && <div className="animate-fade-up-delay">{actions}</div>}
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={resolveMediaUrl(src)}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-800', sizes[size])}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 font-semibold text-brand-700 dark:from-brand-800 dark:to-brand-900 dark:text-brand-200',
        sizes[size],
      )}
    >
      {initials || '?'}
    </div>
  );
}
