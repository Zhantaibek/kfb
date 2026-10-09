"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppProviders";
import { Logo } from "@/components/Logo";
import { AdminIcon } from "@/components/admin/AdminIcons";
import { AdminLangSwitch } from "@/components/admin/AdminLangSwitch";
import css from "@/app/admin/admin.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: Parameters<typeof AdminIcon>[0]["name"];
  /** Открыть в новой вкладке (Swagger). */
  blank?: boolean;
};

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "Обзор",
    items: [{ href: "/admin/dashboard", label: "Панель", icon: "dashboard" as const }],
  },
  {
    title: "Контент",
    items: [
      { href: "/admin/news", label: "Новости", icon: "news" as const },
      { href: "/admin/menu", label: "Меню и страницы", icon: "menu" as const },
      { href: "/admin/hubs", label: "Главная", icon: "site" as const },
      { href: "/admin/management", label: "Руководство", icon: "users" as const },
      { href: "/admin/partners", label: "Партнёры", icon: "users" as const },
      { href: "/admin/sustainable", label: "Устойчивое развитие", icon: "site" as const },
      { href: "/admin/gcb-invest", label: "Инвестиции в ГЦБ", icon: "site" as const },
      { href: "/admin/media", label: "Медиа / фото", icon: "media" as const },
      { href: "/admin/settings", label: "Подвал и контакты", icon: "requests" as const },
      { href: "/admin/requests", label: "Заявки", icon: "requests" as const },
    ],
  },
  {
    title: "Система",
    items: [
      { href: "/admin/users", label: "Пользователи", icon: "users" as const },
      { href: "/admin/visits", label: "Посещения", icon: "visits" as const },
      { href: "/admin/audit", label: "Журнал аудита", icon: "audit" as const },
      { href: "/admin/api", label: "Swagger API", icon: "swagger" as const, blank: true },
    ],
  },
];

const titles: Record<string, { title: string; lead: string }> = {
  "/admin/dashboard": { title: "Панель управления", lead: "Обзор CMS, API и быстрые переходы" },
  "/admin/news": { title: "Новости", lead: "Публикации сайта" },
  "/admin/menu": { title: "Меню и страницы", lead: "Шапка сайта и тексты разделов" },
  "/admin/hubs": { title: "Главная", lead: "Карточки на главной странице" },
  "/admin/management": { title: "Руководство", lead: "Совет директоров и исполнительный орган" },
  "/admin/partners": { title: "Партнёры", lead: "Блок «Наши партнеры» на главной и страницы партнёров" },
  "/admin/sustainable": { title: "Устойчивое развитие", lead: "Сектор устойчивого развития: тексты, бумаги, верификаторы, ESG-отчёты" },
  "/admin/gcb-invest": { title: "Инвестиции в ГЦБ", lead: "Тексты страницы, брокеры и банки" },
  "/admin/media": { title: "Медиа / фото", lead: "Загрузки CMS" },
  "/admin/settings": { title: "Подвал и контакты", lead: "Баннер подвала, телефоны, адрес, соцсети и копирайт" },
  "/admin/requests": { title: "Заявки", lead: "Обращения с сайта" },
  "/admin/users": { title: "Пользователи", lead: "Доступ в портал" },
  "/admin/visits": { title: "Посещения", lead: "Открытия публичных страниц" },
  "/admin/audit": { title: "Журнал аудита", lead: "Действия администраторов" },
  "/admin/api": { title: "Swagger API", lead: "Документация и проверка методов" },
  "/admin/profile": { title: "Профиль", lead: "Текущая учётная запись" },
};

function readNavCollapsed() {
  try {
    return typeof window !== "undefined" && localStorage.getItem("kse-admin-nav") === "collapsed";
  } catch {
    return false;
  }
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, tr } = useApp();
  const [ready, setReady] = useState(pathname === "/admin/login");
  const [open, setOpen] = useState(false);
  // Шапка админки рисуется только в браузере (до проверки сессии — заглушка), поэтому localStorage читаем сразу.
  const [collapsed, setCollapsed] = useState(() => readNavCollapsed());
  const [name, setName] = useState("Админ");
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [clock, setClock] = useState("");

  const page = useMemo(() => {
    const raw = titles[pathname] ?? { title: "Портал администратора", lead: "CMS Кыргызской фондовой биржи" };
    return { title: tr(raw.title), lead: tr(raw.lead) };
  }, [pathname, tr]);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleString(lang === "en" ? "en-GB" : lang === "ky" ? "ky-KG" : "ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [lang]);

  useEffect(() => {
    void fetch("/api/health")
      .then((response) => setApiOk(response.ok))
      .catch(() => setApiOk(false));
  }, [pathname]);

  useEffect(() => {
    // Страница входа рисуется без проверки сессии (см. ранний return ниже).
    if (pathname === "/admin/login") return;
    fetch("/api/admin/session", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = (await response.json()) as { user?: { name: string } };
        setName(data.user?.name ?? "Админ");
        setReady(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [pathname, router]);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem("kse-admin-nav", next ? "collapsed" : "open");
      return next;
    });
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE", credentials: "include" });
    router.replace("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready) {
    return (
      <div className={css.boot}>
        <p>{tr("Проверка сессии…")}</p>
      </div>
    );
  }

  return (
    <div className={css.app} data-menu={open} data-collapsed={collapsed}>
      <div className={css.sidebarDock} id="admin-mobile-sidebar">
        <aside className={css.sidebar}>
          <div className={css.brandWrap}>
            <div className={css.logoGlow} aria-hidden="true" />
            <button className={css.collapseBtn} type="button" onClick={toggleCollapsed} title={tr("Свернуть меню")} aria-label={tr("Свернуть меню")}>
              <AdminIcon name="chevron" size={16} />
            </button>
            <Link className={css.brand} href="/admin/dashboard" title={tr("Панель управления")}>
              <span className={css.brandMark}>
                <Logo />
              </span>
              <span className={css.brandText}>
                <b>{tr("КФБ")}</b>
                <small>{tr("Портал администратора")}</small>
              </span>
            </Link>
          </div>
          <nav className={css.sideNav} aria-label={tr("Админ-навигация")}>
            {groups.map((group) => (
              <div className={css.navGroup} key={group.title}>
                <p>{tr(group.title)}</p>
                {group.items.map((item) => (
                  <Link
                    href={item.href}
                    key={item.href}
                    data-on={pathname === item.href}
                    title={tr(item.label)}
                    target={item.blank ? "_blank" : undefined}
                    rel={item.blank ? "noreferrer" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <AdminIcon name={item.icon} />
                    <span>{tr(item.label)}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <div className={css.sideFoot}>
            <Link href="/admin/profile" title={tr("Профиль")} onClick={() => setOpen(false)}>
              <AdminIcon name="profile" />
              <span>{tr("Профиль")}</span>
            </Link>
            <Link href="/" title={tr("На сайт")}>
              <AdminIcon name="site" />
              <span>{tr("На сайт")}</span>
            </Link>
            <button type="button" className={css.logout} title={tr("Выйти")} onClick={() => void logout()}>
              <AdminIcon name="logout" />
              <span>{tr("Выйти")}</span>
            </button>
          </div>
        </aside>
      </div>

      <div className={css.workspace}>
        <div className={css.backdrop} aria-hidden="true">
          <div className={css.backdropBase} />
          <div className={css.backdropGrid} />
          <div className={`${css.orb} ${css.orbA}`} />
          <div className={`${css.orb} ${css.orbB}`} />
          <div className={css.scan} />
        </div>
        <header className={css.mobileHeader}>
          <button type="button" className={css.iconBtn} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <span className={css.srOnly}>{tr("Меню")}</span>
            <AdminIcon name="burger" />
          </button>
          <Logo />
          <span>
            КФБ · {name}
          </span>
        </header>
        <header className={css.topBar}>
          <div className={css.topLeft}>
            <button type="button" className={css.iconBtn} onClick={toggleCollapsed} title={tr("Свернуть меню")} aria-label={tr("Свернуть меню")}>
              <AdminIcon name="burgerShort" size={18} />
            </button>
            <div>
              <h1>{page.title}</h1>
              <p>{page.lead}</p>
            </div>
          </div>
          <div className={css.topMeta}>
            <AdminLangSwitch />
            <div className={css.apiPill}>
              <span className={css.ping} data-ok={apiOk === true}>
                <span />
                <span />
              </span>
              <span>API</span>
              <code>{apiOk === null ? "…" : apiOk ? "online" : "offline"}</code>
            </div>
            <time>{clock}</time>
          </div>
        </header>
        <main className={css.scroll}>
          <div className={css.content}>{children}</div>
        </main>
      </div>
      {open ? <button className={css.dim} type="button" aria-label={tr("Закрыть меню")} onClick={() => setOpen(false)} /> : null}
    </div>
  );
}
