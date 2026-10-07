import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';

export function AuthShell({ children, wide }: PropsWithChildren<{ wide?: boolean }>) {
  return (
    <div className="auth-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="auth-orb pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />
      <div className="auth-orb pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl [animation-delay:2s]" />
      <div className={`relative w-full animate-fade-up ${wide ? 'max-w-lg' : 'max-w-md'}`}>
        <Link
          to="/"
          className="mb-4 inline-block text-sm font-medium text-kse-muted transition hover:text-brand-700"
        >
          ← На главную
        </Link>
        <div className="glass-panel rounded-[1.75rem] p-8 sm:p-9">{children}</div>
      </div>
    </div>
  );
}
