import { createContext, useContext } from 'react';
import type { EmbedConfig } from './runtime';
import { EDU_API_URL } from '../config';

export interface EducationContextValue extends EmbedConfig {
  /** Convenience: eduPath bound to current basePath */
  path: (suffix: string) => string;
}

const EducationContext = createContext<EducationContextValue | null>(null);

export function EducationProvider({
  value,
  children,
}: {
  value: EducationContextValue;
  children: React.ReactNode;
}) {
  return <EducationContext.Provider value={value}>{children}</EducationContext.Provider>;
}

export function useEducation() {
  const ctx = useContext(EducationContext);
  if (!ctx) {
    // Standalone fallback — keeps pages working outside EducationApp
    return {
      basePath: '',
      apiBaseUrl: EDU_API_URL,
      mode: 'standalone' as const,
      hideLogout: false,
      path: (suffix: string) => {
        const clean = suffix.replace(/^\//, '');
        return clean ? `/${clean}` : '/';
      },
    };
  }
  return ctx;
}
