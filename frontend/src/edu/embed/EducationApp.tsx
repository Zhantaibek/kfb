import { useEffect, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import type { User } from '../types';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { EducationProvider } from './EducationContext';
import { EducationRoutes } from './EducationRoutes';
import { configureEmbed, eduPath, type EmbedMode } from './runtime';
import '../index.css';
import { EDU_API_URL } from '../config';

export interface EducationAppProps {
  /** Host mount path, default `/education` */
  basePath?: string;
  /** EduCRM API URL including `/api` */
  apiBaseUrl?: string;
  /** JWT from host auth */
  token: string;
  /** Current user (EduCRM-compatible shape) */
  user: User;
  /** embedded = section of host site */
  mode?: EmbedMode;
  /** Hide EduCRM "Выйти" — host handles session */
  hideLogout?: boolean;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
  onLogout?: () => void;
  /** Show toaster (disable if host already has one) */
  showToaster?: boolean;
}

/**
 * Embeddable EduCRM section for another React app.
 *
 * @example
 * <Route
 *   path="/education/*"
 *   element={
 *     <EducationApp
 *       basePath="/education"
 *       token={hostToken}
 *       user={mapToEduUser(hostUser)}
 *       apiBaseUrl="http://localhost:4000/api"
 *       onUnauthorized={() => hostNavigate('/login')}
 *     />
 *   }
 * />
 */
export function EducationApp({
  basePath = '/education',
  apiBaseUrl,
  token,
  user,
  mode = 'embedded',
  hideLogout = true,
  getAccessToken,
  onUnauthorized,
  onLogout,
  showToaster = true,
}: EducationAppProps) {
  const setSession = useAuthStore((s) => s.setSession);
  const initTheme = useUiStore((s) => s.initTheme);

  useEffect(() => {
    configureEmbed({
      basePath,
      apiBaseUrl: apiBaseUrl || EDU_API_URL,
      mode,
      hideLogout,
      getAccessToken: getAccessToken ?? (() => useAuthStore.getState().token),
      onUnauthorized,
      onLogout,
    });
  }, [basePath, apiBaseUrl, mode, hideLogout, getAccessToken, onUnauthorized, onLogout]);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (token && user) {
      setSession(user, token);
    }
  }, [token, user, setSession]);

  const ctx = useMemo(
    () => ({
      basePath: basePath.replace(/\/+$/, '') === '/' ? '' : basePath.replace(/\/+$/, ''),
      apiBaseUrl: apiBaseUrl || EDU_API_URL,
      mode,
      hideLogout,
      getAccessToken,
      onUnauthorized,
      onLogout,
      path: (suffix: string) => {
        configureEmbed({ basePath });
        return eduPath(suffix);
      },
    }),
    [basePath, apiBaseUrl, mode, hideLogout, getAccessToken, onUnauthorized, onLogout],
  );

  // normalize basePath once for context
  const normalizedBase = useMemo(() => {
    if (!basePath || basePath === '/') return '';
    return `/${basePath.replace(/^\/+|\/+$/g, '')}`;
  }, [basePath]);

  const value = useMemo(
    () => ({
      ...ctx,
      basePath: normalizedBase,
      path: (suffix: string) => {
        const clean = suffix.replace(/^\//, '');
        if (!clean) return normalizedBase || '/';
        return normalizedBase ? `${normalizedBase}/${clean}` : `/${clean}`;
      },
    }),
    [ctx, normalizedBase],
  );

  return (
    <EducationProvider value={value}>
      <div className="educrm-root" data-educrm-mode={mode}>
        <EducationRoutes />
        {showToaster && <Toaster position="top-right" toastOptions={{ className: 'text-sm' }} />}
      </div>
    </EducationProvider>
  );
}
