"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { t, tr, htmlLang, type Lang } from "@/lib/i18n";
import { useStoredString, writeStored } from "@/lib/local-store";

type AdminUser = { id?: string; name: string; email: string; role: "admin" | "editor" };

type AppState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Сотрудник CMS (admin/editor). На сайт входят только сотрудники — ролей инвестора и эмитента нет. */
  adminUser: AdminUser | null;
  authReady: boolean;
  /** Возвращает текст ошибки или роль вошедшего сотрудника. */
  login: (email: string, password: string) => Promise<{ error: string } | { role: string }>;
  logout: () => Promise<void>;
  label: (key: Parameters<typeof t>[1]) => string;
  tr: (text: string) => string;
};

const AppContext = createContext<AppState | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  // Язык живёт в localStorage; до гидратации — значение по умолчанию.
  const storedLang = useStoredString("kse-lang");
  const lang: Lang = storedLang === "ky" || storedLang === "en" ? storedLang : "ru";
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    document.documentElement.lang = htmlLang(lang);
  }, [lang]);

  useEffect(() => {
    // Остатки прежнего кабинета инвестора в браузере.
    localStorage.removeItem("kse-user");
    localStorage.removeItem("kse-watch");

    // Для посетителя без входа сервер отвечает user: null (без ошибки 401 в консоли).
    fetch("/api/auth/session", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          setAdminUser(null);
          return;
        }
        const data = (await response.json()) as { user?: AdminUser | null };
        const role = data.user?.role;
        setAdminUser(role === "admin" || role === "editor" ? (data.user ?? null) : null);
      })
      .catch(() => setAdminUser(null))
      .finally(() => setAuthReady(true));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang(next) {
        writeStored("kse-lang", next);
        document.cookie = `kse-lang=${next};path=/;max-age=31536000`;
      },
      adminUser,
      authReady,
      async login(email, password) {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        // Прокси при недоступном API может вернуть не JSON — тогда общая ошибка, а не исключение.
        const payload = (await response.json().catch(() => ({}))) as { user?: AdminUser; error?: string };
        if (!response.ok || !payload.user) return { error: payload.error ?? "Не удалось войти" };
        setAdminUser(payload.user);
        return { role: payload.user.role };
      },
      async logout() {
        await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
        setAdminUser(null);
      },
      label: (key) => t(lang, key),
      tr: (text) => tr(lang, text),
    }),
    [lang, adminUser, authReady],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProviders");
  return ctx;
}
