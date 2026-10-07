import type { User } from '../types';
import { EDU_API_URL, EDU_BASE_PATH } from '../config';

export type EmbedMode = 'standalone' | 'embedded';

export interface EmbedConfig {
  /** Mount path on host site, e.g. `/education` (no trailing slash). Empty = standalone. */
  basePath: string;
  /** API base including `/api`, e.g. `https://api.example.com/api` */
  apiBaseUrl: string;
  mode: EmbedMode;
  /** When embedded, hide EduCRM logout (host owns session) */
  hideLogout: boolean;
  /** Optional: host provides token getter instead of Zustand-only */
  getAccessToken?: () => string | null;
  /** Called on 401 instead of hard redirect to /login */
  onUnauthorized?: () => void;
  /** Called when user clicks logout in EduCRM chrome */
  onLogout?: () => void;
}

const defaultConfig: EmbedConfig = {
  basePath: EDU_BASE_PATH,
  apiBaseUrl: EDU_API_URL,
  mode: 'standalone',
  hideLogout: false,
};

let config: EmbedConfig = { ...defaultConfig };

export function configureEmbed(partial: Partial<EmbedConfig>) {
  config = {
    ...config,
    ...partial,
    basePath: normalizeBasePath(partial.basePath ?? config.basePath),
  };
  return config;
}

export function getEmbedConfig() {
  return config;
}

export function resetEmbedConfig() {
  config = { ...defaultConfig };
}

export function normalizeBasePath(basePath: string) {
  if (!basePath || basePath === '/') return '';
  return `/${basePath.replace(/^\/+|\/+$/g, '')}`;
}

/** Build absolute app path respecting embed basePath */
export function eduPath(path: string) {
  const clean = path.replace(/^\//, '');
  const base = getEmbedConfig().basePath;
  if (!clean) return base || '/';
  return base ? `${base}/${clean}` : `/${clean}`;
}

export interface EducationSessionInput {
  token: string;
  user: User;
}
