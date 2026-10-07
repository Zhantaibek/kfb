'use client';

import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { EducationApp } from './embed';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { MagicLinkVerifyPage } from './pages/Auth/MagicLinkVerifyPage';
import { useAuthStore } from './store/authStore';
import type { User } from './types';
import { EDU_API_URL, EDU_BASE_PATH } from './config';
import './index.css';

type Session = { token: string; user: User };
type State = { status: 'loading' } | { status: 'ready'; session: Session } | { status: 'guest' };

/** На страницу входа сайта — с возвратом туда, где человек был в учебном центре. */
function goToSiteLogin() {
  const back = window.location.pathname + window.location.search;
  window.location.href = `/login?next=${encodeURIComponent(back)}`;
}

/** «Выйти» в учебном центре = выйти с сайта целиком: сессия общая. */
async function logoutEverywhere() {
  useAuthStore.getState().logout();
  await Promise.allSettled([
    fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }),
    fetch('/api/admin/session', { method: 'DELETE', credentials: 'include' }),
  ]);
  window.location.href = '/';
}

/**
 * Учебный центр внутри сайта. Вход — общий: сайт уже знает пользователя по cookie,
 * а бэкенд выдаёт по ней токен учебного центра (/api/edu/session).
 */
export function EduHost() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(`${EDU_API_URL}/session`, { credentials: 'include' })
      .then(async (response) => {
        if (cancelled) return;
        if (!response.ok) {
          useAuthStore.getState().logout();
          setState({ status: 'guest' });
          return;
        }
        const { data } = (await response.json()) as { data: Session };
        useAuthStore.getState().setSession(data.user, data.token);
        setState({ status: 'ready', session: data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'guest' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Глобальные стили учебного центра (Tailwind) Next не выгружает при переходе на другие страницы.
  // Поэтому, если ушли со страницы учебного центра без перезагрузки (кнопка «Назад»), перезагружаем её начисто.
  useEffect(
    () => () => {
      if (!window.location.pathname.startsWith(EDU_BASE_PATH)) window.location.reload();
    },
    [],
  );

  return (
    <BrowserRouter basename={EDU_BASE_PATH}>
      <Routes>
        <Route path="register" element={<RegisterPage />} />
        <Route path="auth/verify" element={<MagicLinkVerifyPage />} />
        <Route path="login" element={<SiteLoginRedirect />} />
        <Route
          path="*"
          element={
            state.status === 'ready' ? (
              <EducationApp
                // Пути внутри приложения считаются от basename роутера (/education/app), поэтому своя база — пустая.
                basePath=""
                apiBaseUrl={EDU_API_URL}
                token={state.session.token}
                user={state.session.user}
                mode="embedded"
                hideLogout={false}
                onUnauthorized={goToSiteLogin}
                onLogout={() => void logoutEverywhere()}
              />
            ) : state.status === 'guest' ? (
              <SiteLoginRedirect />
            ) : (
              <EduLoading />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function SiteLoginRedirect() {
  useEffect(() => {
    // Сюда ведёт и «Выйти» внутри учебного центра — снимаем и сессию сайта.
    if (useAuthStore.getState().token) void logoutEverywhere();
    else goToSiteLogin();
  }, []);
  return <EduLoading />;
}

function EduLoading() {
  return (
    <div className="educrm-root flex min-h-screen items-center justify-center text-sm text-kse-muted">
      Загрузка учебного центра…
    </div>
  );
}
