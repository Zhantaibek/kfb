"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderSearch } from "@/components/HeaderSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProviders";
import { languages } from "@/lib/i18n";
import { type SiteLink } from "@/data/site-nav";
import { useSiteNav } from "@/lib/cms/use-site-nav";
import ui from "@/app/ui.module.css";

/** Внешние ссылки (в т.ч. отдельная учебная платформа) — полный переход. */
function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function AppLink({
  href,
  children,
  className,
  onClick,
  role,
  active,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
  active?: boolean;
}) {
  const on = active ? "true" : undefined;
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} onClick={onClick} role={role} data-on={on} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick} role={role} data-on={on}>
      {children}
    </Link>
  );
}

/**
 * Выпадашки шапки (язык, кабинет) закрываются сами, когда курсор уходит с кнопки и списка.
 * Небольшая задержка — чтобы меню не мигало, если курсор на миг вышел за край.
 */
function useHoverClose() {
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return {
    onMouseLeave(event: React.MouseEvent<HTMLDetailsElement>) {
      const details = event.currentTarget;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => details.removeAttribute("open"), 200);
    },
    onMouseEnter() {
      window.clearTimeout(timer.current);
    },
  };
}

function closeDetails(ref: React.RefObject<HTMLDetailsElement | null>) {
  ref.current?.removeAttribute("open");
}

function blurFocus() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function navOn(pathname: string, href: string) {
  if (!href || href === "/" || isExternalHref(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function translateNav(items: SiteLink[], translate: (text: string) => string): SiteLink[] {
  return items.map((item) => ({
    ...item,
    label: translate(item.label),
    children: item.children ? translateNav(item.children, translate) : undefined,
  }));
}

export function SiteHeader() {
  const { label, lang, setLang, user, adminUser, logout, tr } = useApp();
  const pathname = usePathname();
  // primary — строка навигации шапки (как на kse.kg), nav — полное меню в бургере. Оба из БД.
  const { nav, primary } = useSiteNav();
  const menus = nav.map((menu) => ({
    ...menu,
    label: tr(menu.label),
    items: translateNav(menu.items, tr),
  }));
  const menuRef = useRef<HTMLDetailsElement>(null);
  const hoverClose = useHoverClose();

  function closeMenus() {
    blurFocus();
    closeDetails(menuRef);
  }

  useEffect(() => {
    closeMenus();
  }, [pathname]);

  return (
    <header className={ui.header}>
      <Link className={ui.brand} href="/" aria-label={tr("Кыргызская фондовая биржа — главная")}>
        <Logo variant="lockup" className={ui.logoLockup} priority />
        <Logo className={ui.logoMarkMobile} priority />
      </Link>

      <nav className={ui.nav} aria-label={tr("Основная навигация")}>
        {primary.map((item) => (
          <AppLink
            key={item.href + item.label}
            className={ui.navLink}
            href={item.href}
            active={navOn(pathname, item.href)}
          >
            {tr(item.label)}
          </AppLink>
        ))}
      </nav>

      <div className={ui.headerActions}>
        {/* Язык */}
        <details className={ui.drop} name="kse-header" key={pathname + "-lang"} {...hoverClose}>
          <summary className={ui.langBtn}>
            {lang === "ky" ? "KY" : lang === "en" ? "EN" : "RU"}
          </summary>
          <div className={ui.dropPanel}>
            {languages.map((item) => (
              <button
                key={item.id}
                type="button"
                data-active={item.id === lang}
                onClick={() => setLang(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </details>

        <HeaderSearch />

        <ThemeToggle />

        {/* Войти / Кабинет */}
        {user || adminUser ? (
          <details className={ui.drop} name="kse-header" key={pathname + "-cab"} {...hoverClose}>
            <summary className={ui.cabinetBtn}>{user ? label("cabinet") : tr("Админ-панель")}</summary>
            <div className={ui.dropPanel}>
              {user ? <Link href="/cabinet">{user.name}</Link> : null}
              {adminUser ? <Link href="/admin">{tr("Админ-панель")}</Link> : null}
              <button type="button" onClick={() => void logout()}>
                {label("logout")}
              </button>
            </div>
          </details>
        ) : (
          <Link className={ui.cabinetBtn} href="/login">
            {label("login")}
          </Link>
        )}

        {/* Бургер-меню */}
        <details className={`${ui.drop} ${ui.menu}`} name="kse-header" ref={menuRef} key={pathname + "-menu"}>
          <summary aria-label={label("menu")}>
            <i />
            <i />
          </summary>
          <nav className={ui.menuPanel} aria-label={tr("Все разделы")}>
            <p>{label("menu")}</p>
            {menus.map((group) =>
              group.items.length ? (
                <details key={group.key} className={ui.menuGroup}>
                  <summary>{group.label}</summary>
                  {group.items.flatMap((item) =>
                    item.children?.length
                      ? item.children.map((child) => (
                          <AppLink key={child.href} href={child.href} onClick={closeMenus}>
                            {child.label}
                          </AppLink>
                        ))
                      : [
                          <AppLink key={item.href + item.label} href={item.href} onClick={closeMenus}>
                            {item.label}
                          </AppLink>,
                        ],
                  )}
                </details>
              ) : (
                <AppLink key={group.key} href={group.href} onClick={closeMenus}>
                  {group.label}
                </AppLink>
              ),
            )}
          </nav>
          {/* На компьютере — панель на всю ширину с колонками по группам, как на kse.kg. */}
          <nav className={ui.megaPanel} aria-label={tr("Все разделы")}>
            <div className={ui.megaGrid}>
              {menus.map((group) => (
                <section key={group.key} className={ui.megaCol}>
                  <AppLink className={ui.megaHead} href={group.href} onClick={closeMenus}>
                    {group.label}
                  </AppLink>
                  {group.items.map((item) =>
                    item.children?.length ? (
                      <details key={item.href + item.label} className={ui.megaSub}>
                        <summary>{item.label}</summary>
                        {item.children.map((child) => (
                          <AppLink key={child.href + child.label} href={child.href} onClick={closeMenus}>
                            {child.label}
                          </AppLink>
                        ))}
                      </details>
                    ) : (
                      <AppLink key={item.href + item.label} href={item.href} onClick={closeMenus}>
                        {item.label}
                      </AppLink>
                    ),
                  )}
                </section>
              ))}
            </div>
          </nav>
          <button className={ui.megaBackdrop} type="button" aria-label={label("menu")} tabIndex={-1} onClick={closeMenus} />
        </details>
      </div>
    </header>
  );
}