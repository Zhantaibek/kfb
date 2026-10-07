import { clsx, type ClassValue } from 'clsx';
import { EDU_API_URL } from '../config';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatMoney(value: number | string) {
  const num = Number(value);
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(num);
  return `${formatted} сом`;
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function fullName(user?: { profile?: { firstName?: string; lastName?: string } | null; email?: string } | null) {
  if (!user) return '—';
  if (user.profile?.firstName) {
    return `${user.profile.firstName} ${user.profile.lastName ?? ''}`.trim();
  }
  return user.email ?? '—';
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'Активен',
    BLOCKED: 'Заблокирован',
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликован',
    ARCHIVED: 'Архив',
    PENDING: 'Ожидает',
    PAID: 'Оплачен',
    FAILED: 'Ошибка',
    REFUNDED: 'Возврат',
    SUBMITTED: 'Сдано',
    REVIEWED: 'Проверено',
    LATE: 'Просрочено',
    BEGINNER: 'Начальный',
    INTERMEDIATE: 'Средний',
    ADVANCED: 'Продвинутый',
  };
  return map[status] ?? status;
}

export function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'response' in error) {
    const response = (error as {
      response?: {
        data?: {
          error?: { message?: string; details?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } } | string;
          message?: string;
        };
      };
    }).response;
    const err = response?.data?.error;
    if (typeof err === 'string') return err;
    const formError = err?.details?.formErrors?.find(Boolean);
    const fieldError = err?.details?.fieldErrors
      ? Object.values(err.details.fieldErrors).flat().find(Boolean)
      : undefined;
    return formError ?? fieldError ?? err?.message ?? response?.data?.message ?? 'Произошла ошибка';
  }
  if (error instanceof Error) return error.message;
  return 'Произошла ошибка';
}

/** Resolve media paths from API (`/api/uploads/...`) against VITE_API_URL origin. */
export function resolveMediaUrl(url?: string | null) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = EDU_API_URL;
  if (url.startsWith('/api/') && /^https?:\/\//i.test(apiBase)) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  }
  return url;
}

export function youtubeEmbedUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split('/');
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}
