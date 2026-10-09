"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderSearch } from "@/components/HeaderSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProviders";
import { languages } from "@/lib/i18n";
import { type SiteLink } from "@/data/site-nav";
import { useSiteNav } from "@/lib/cms/use-site-nav";
import { EDU_URL } from "@/lib/edu";
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
    // Учебный центр — часть сайта КФБ для посетителя, открываем в той же вкладке; прочие внешние — в новой.
    const sameTab = href.startsWith(EDU_URL);
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        role={role}
        data-on={on}
        target={sameTab ? undefined : "_blank"}
        rel={sameTab ? undefined : "noopener noreferrer"}
      >
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

/**
 * Пока открыто меню, страница под ним не прокручивается и её полоса прокрутки не видна.
 * Ширину пропавшей полосы возвращаем отступом — иначе шапка дёрнулась бы вбок.
 */
function lockPageScroll(lock: boolean) {
  const root = document.documentElement;
  if (lock) {
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    root.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : "";
  } else {
    root.style.overflow = "";
    root.style.paddingRight = "";
  }
}

/** Длительность анимации закрытия меню — совпадает с menuOut/megaOut в ui.module.css. */
const MENU_CLOSE_MS = 280;

/**
 * <details> закрывается мгновенно, поэтому сначала проигрываем анимацию (data-closing),
 * и только потом снимаем open.
 */
function closeMenuAnimated(menu: HTMLDetailsElement | null) {
  if (!menu?.open || menu.dataset.closing) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    menu.removeAttribute("open");
    return;
  }
  menu.dataset.closing = "true";
  window.setTimeout(() => {
    delete menu.dataset.closing;
    menu.removeAttribute("open");
  }, MENU_CLOSE_MS);
}

function blurFocus() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

/** Разделы-«хабы»: пункт меню горит и на страницах, куда ведут их карточки. */
const hubSections: Record<string, string[]> = { "/statistics": ["/market", "/gcb"] };

/** Шаги ужатия шапки: 0 — как есть, 1–3 — мельче шрифт, на 3 значок вместо логотипа, 4 — разделы только в бургере. */
const NAV_FIT_MAX = 4;

/**
 * Разделы, логотип и кнопки не должны перекрываться ни на какой ширине и ни на каком языке
 * (кыргызские и английские названия длиннее). Меряем, влезает ли строка, и ужимаем по шагам.
 */
function useNavFit(lang: string) {
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const nav = navRef.current;
    if (!header || !nav) return;

    const overflows = () => {
      if (getComputedStyle(nav).display === "none") return false;
      const links = [...nav.children] as HTMLElement[];
      const gap = parseFloat(getComputedStyle(nav).columnGap) || 0;
      const need = links.reduce((sum, el) => sum + el.getBoundingClientRect().width, 0) + gap * Math.max(links.length - 1, 0);
      return need > nav.clientWidth + 0.5;
    };

    const fit = () => {
      let level = 0;
      header.dataset.navFit = "0";
      while (level < NAV_FIT_MAX && overflows()) {
        level += 1;
        header.dataset.navFit = String(level);
      }
    };

    // Замер — не чаще раза за кадр: ResizeObserver срабатывает и от наших же изменений шага.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    // Ширина шапки (окно) и текст пунктов (перевод из БД, подгрузка шрифтов) меняются независимо.
    const resize = new ResizeObserver(schedule);
    resize.observe(header);
    // Место под разделы меняется и без изменения окна: после входа появляется широкая кнопка «Админ-панель»,
    // подгружается логотип. Колонка меню при этом сжимается — следим и за ней.
    resize.observe(nav);
    const mutation = new MutationObserver(schedule);
    mutation.observe(nav, { childList: true, subtree: true, characterData: true });
    document.fonts?.ready.then(schedule).catch(() => {});
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
    };
  }, [lang]);

  return { headerRef, navRef };
}

function navOn(pathname: string, href: string) {
  if (hubSections[href]?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return pathname !== "/gcb/invest";
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
  const { label, lang, setLang, adminUser, logout, tr } = useApp();
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
  const { headerRef, navRef } = useNavFit(lang);

  function closeMenus() {
    blurFocus();
    closeMenuAnimated(menuRef.current);
  }

  // Переход на другую страницу пересоздаёт меню без события toggle — снимаем блокировку прокрутки сами.
  useEffect(() => () => lockPageScroll(false), [pathname]);

  useEffect(() => {
    closeMenus();
  }, [pathname]);

  return (
    <header className={ui.header} ref={headerRef}>
      <Link className={ui.brand} href="/" aria-label={tr("Кыргызская фондовая биржа — главная")}>
        <Logo variant="lockup" className={ui.logoLockup} priority />
        <Logo className={ui.logoMarkMobile} priority />
      </Link>

      <nav className={ui.nav} ref={navRef} aria-label={tr("Основная навигация")}>
        {primary.map((item) => {
          const text = tr(item.label);
          return (
            <AppLink
              key={item.href + item.label}
              className={ui.navLink}
              href={item.href}
              active={navOn(pathname, item.href)}
            >
              {text}
            </AppLink>
          );
        })}
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

        {/* «Личный кабинет» — вход только для администраторов: ведёт в админ-панель (без сессии — на её страницу входа). */}
        {adminUser ? (
          <details className={ui.drop} name="kse-header" key={pathname + "-cab"} {...hoverClose}>
            <summary className={ui.cabinetBtn}>{tr("Личный кабинет")}</summary>
            <div className={ui.dropPanel}>
              <Link href="/admin">{tr("Админ-панель")}</Link>
              <button type="button" onClick={() => void logout()}>
                {label("logout")}
              </button>
            </div>
          </details>
        ) : (
          <Link className={ui.cabinetBtn} href="/admin">
            {tr("Личный кабинет")}
          </Link>
        )}

        {/* Бургер-меню */}
        <details
          className={`${ui.drop} ${ui.menu}`}
          name="kse-header"
          ref={menuRef}
          key={pathname + "-menu"}
          onToggle={(event) => lockPageScroll(event.currentTarget.open)}
        >
          <summary
            aria-label={label("menu")}
            onClick={(event) => {
              if (!menuRef.current?.open) return;
              event.preventDefault();
              closeMenuAnimated(menuRef.current);
            }}
          >
            <i />
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