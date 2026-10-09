"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { t, tr, htmlLang, type Lang } from "@/lib/i18n";
import { useStoredString, writeStored } from "@/lib/local-store";

const defaultWatchlist = ["KTEL", "KAKB"];

function parseWatchlist(raw: string | null): string[] {
  if (!raw) return defaultWatchlist;
  try {
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : defaultWatchlist;
  } catch {
    return defaultWatchlist;
  }
}

type User = { id?: string; name: string; email: string; role: "issuer" | "student" | "teacher" };
type AdminUser = { id?: string; name: string; email: string; role: "admin" | "editor" };

type AppState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  user: User | null;
  /** Сотрудник CMS (admin/editor), вошедший через /admin/login. */
  adminUser: AdminUser | null;
  authReady: boolean;
  /** Возвращает текст ошибки или признак того, что вошёл сотрудник CMS. */
  login: (email: string, password: string) => Promise<{ error: string } | { staff: boolean; role: string }>;
  logout: () => Promise<void>;
  watchlist: string[];
  toggleWatch: (ticker: string) => void;
  label: (key: Parameters<typeof t>[1]) => string;
  tr: (text: string) => string;
};

const AppContext = createContext<AppState | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  // Язык и избранное живут в localStorage; до гидратации — значения по умолчанию.
  const storedLang = useStoredString("kse-lang");
  const lang: Lang = storedLang === "ky" || storedLang === "en" ? storedLang : "ru";
  const storedWatch = useStoredString("kse-watch");
  const watchlist = useMemo(() => parseWatchlist(storedWatch), [storedWatch]);
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    document.documentElement.lang = htmlLang(lang);
  }, [lang]);

  useEffect(() => {
    localStorage.removeItem("kse-user");

    const userSession = fetch("/api/auth/session", { credentials: "include" })
      .then(async (response) => {
        const data = (await response.json()) as { user?: User | null };
        setUser(response.ok ? (data.user ?? null) : null);
      })
      .catch(() => setUser(null));

    // Для обычных посетителей ответ 401 — это нормально, просто админа нет.
    const adminSession = fetch("/api/admin/session", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          setAdminUser(null);
          return;
        }
        const data = (await response.json()) as { user?: AdminUser | null };
        const role = data.user?.role;
        setAdminUser(role === "admin" || role === "editor" ? (data.user ?? null) : null);
      })
      .catch(() => setAdminUser(null));

    void Promise.all([userSession, adminSession]).finally(() => setAuthReady(true));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang(next) {
        writeStored("kse-lang", next);
        document.cookie = `kse-lang=${next};path=/;max-age=31536000`;
      },
      user,
      adminUser,
      authReady,
      async login(email, password) {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const payload = (await response.json()) as { user?: User | AdminUser; error?: string };
        if (!response.ok) return { error: payload.error ?? "Не удалось войти" };
        const account = payload.user ?? null;
        // Бэкенд выдаёт админу/редактору админскую cookie, поэтому и в состоянии он админ.
        if (account?.role === "admin" || account?.role === "editor") {
          setAdminUser(account);
          return { staff: true, role: account.role };
        }
        setUser(account as User | null);
        return { staff: false, role: account?.role ?? "" };
      },
      async logout() {
        await Promise.all([
          fetch("/api/auth/session", { method: "DELETE", credentials: "include" }),
          adminUser ? fetch("/api/admin/session", { method: "DELETE", credentials: "include" }) : null,
        ]);
        setUser(null);
        setAdminUser(null);
      },
      watchlist,
      toggleWatch(ticker) {
        const next = watchlist.includes(ticker) ? watchlist.filter((item) => item !== ticker) : [...watchlist, ticker];
        writeStored("kse-watch", JSON.stringify(next));
      },
      label: (key) => t(lang, key),
      tr: (text) => tr(lang, text),
    }),
    [lang, user, adminUser, authReady, watchlist],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProviders");
  return ctx;
}