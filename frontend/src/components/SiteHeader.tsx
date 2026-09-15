"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  role?: string;
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} onClick={onClick} role={role} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick} role={role}>
      {children}
    </Link>
  );
}

function NavLinks({
  items,
  onNavigate,
}: {
  items: SiteLink[];
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) =>
        item.children?.length ? (
          <div className={ui.navGroup} key={item.href + item.label}>
            <p>{item.label}</p>
            {item.children.map((child) => (
              <AppLink href={child.href} key={child.href} role="menuitem" onClick={onNavigate}>
                <b>{child.label}</b>
              </AppLink>
            ))}
          </div>
        ) : (
          <AppLink href={item.href} key={item.href + item.label} role="menuitem" onClick={onNavigate}>
            <b>{item.label}</b>
          </AppLink>
        ),
      )}
    </>
  );
}

function closeDetails(ref: React.RefObject<HTMLDetailsElement | null>) {
  ref.current?.removeAttribute("open");
}

function blurFocus() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

function translateNav(items: SiteLink[], translate: (text: string) => string): SiteLink[] {
  return items.map((item) => ({
    ...item,
    label: translate(item.label),
    children: item.children ? translateNav(item.children, translate) : undefined,
  }));
}

export function SiteHeader() {
  const { label, lang, setLang, user, logout, tr } = useApp();
  const pathname = usePathname();
  const { nav } = useSiteNav();
  const menus = nav.map((menu) => ({
    ...menu,
    label: tr(menu.label),
    items: translateNav(menu.items, tr),
  }));
  const menuRef = useRef<HTMLDetailsElement>(null);

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
        {menus.map((menu) => (
          <div className={ui.navItem} key={menu.key}>
            <Link className={ui.navLink} href={menu.href}>
              {menu.label}
            </Link>
            {menu.items.length ? (
              <div className={ui.navPanel} role="menu">
                <NavLinks items={menu.items} onNavigate={closeMenus} />
              </div>
            ) : null}
          </div>
        ))}
      </nav>

      <div className={ui.headerActions}>
        <details className={ui.drop} name="kse-header" key={pathname + "-cab"}>
          <summary className={ui.cabinetBtn}>{label("cabinet")}</summary>
          <div className={ui.dropPanel}>
            {user ? (
              <>
                <Link href="/cabinet">{user.name}</Link>
                <button type="button" onClick={() => void logout()}>
                  {label("logout")}
                </button>
              </>
            ) : (
              <Link href="/login">{label("login")}</Link>
            )}
          </div>
        </details>

        <Link className="icon-ghost" href="/search" aria-label={label("search")}>
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
        </Link>

        <ThemeToggle />

        <details className={ui.drop} name="kse-header" key={pathname + "-lang"}>
          <summary className={ui.langBtn}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
            </svg>
            {languages.find((item) => item.id === lang)?.label}
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
        </details>
      </div>
    </header>
  );
}
