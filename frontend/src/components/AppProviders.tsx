"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { t, tr, htmlLang, type Lang } from "@/lib/i18n";

type User = { id?: string; name: string; email: string; role: "investor" | "issuer" };

type AppState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  user: User | null;
  authReady: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (input: { name: string; email: string; password: string }) => Promise<string | null>;
  logout: () => Promise<void>;
  watchlist: string[];
  toggleWatch: (ticker: string) => void;
  label: (key: Parameters<typeof t>[1]) => string;
  tr: (text: string) => string;
};

const AppContext = createContext<AppState | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(["KTEL", "KAKB"]);

  useEffect(() => {
    const savedLang = localStorage.getItem("kse-lang") as Lang | null;
    if (savedLang === "ru" || savedLang === "ky" || savedLang === "en") {
      setLangState(savedLang);
      document.documentElement.lang = htmlLang(savedLang);
    }
    const savedWatch = localStorage.getItem("kse-watch");
    if (savedWatch) {
      try {
        setWatchlist(JSON.parse(savedWatch) as string[]);
      } catch {
        localStorage.removeItem("kse-watch");
      }
    }
    localStorage.removeItem("kse-user");
    void fetch("/api/auth/session", { credentials: "include" })
      .then(async (response) => {
        const data = (await response.json()) as { user?: User | null };
        setUser(response.ok ? (data.user ?? null) : null);
      })
      .catch(() => setUser(null))
      .finally(() => setAuthReady(true));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang(next) {
        setLangState(next);
        localStorage.setItem("kse-lang", next);
        document.documentElement.lang = htmlLang(next);
        document.cookie = `kse-lang=${next};path=/;max-age=31536000`;
      },
      user,
      authReady,
      async login(email, password) {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const payload = (await response.json()) as { user?: User; error?: string };
        if (!response.ok) return payload.error ?? "Не удалось войти";
        setUser(payload.user ?? null);
        return null;
      },
      async register(input) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...input, role: "investor" }),
        });
        const payload = (await response.json()) as { user?: User; error?: string };
        if (!response.ok) return payload.error ?? "Не удалось зарегистрироваться";
        setUser(payload.user ?? null);
        return null;
      },
      async logout() {
        await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
        setUser(null);
      },
      watchlist,
      toggleWatch(ticker) {
        setWatchlist((current) => {
          const next = current.includes(ticker) ? current.filter((item) => item !== ticker) : [...current, ticker];
          localStorage.setItem("kse-watch", JSON.stringify(next));
          return next;
        });
      },
      label: (key) => t(lang, key),
      tr: (text) => tr(lang, text),
    }),
    [lang, user, authReady, watchlist],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProviders");
  return ctx;
}
