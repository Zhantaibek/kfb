"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProviders";
import { formatChange, formatSom, type Instrument } from "@/data/catalog";
import { useMarketData } from "@/components/MarketDataProvider";
import { mailHref, splitLines, telHref } from "@/lib/cms/contacts";
import { useSiteNav } from "@/lib/cms/use-site-nav";
import ui from "@/app/ui.module.css";

function FooterLink({ href, label, children }: { href: string; label?: string; children?: ReactNode }) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children ?? label}
      </a>
    );
  }
  return <Link href={href}>{children ?? label}</Link>;
}

/** Иконки кнопок баннера по порядку: торги, письмо, дальше — стрелка. */
const buttonIcons = [
  <>
    <path d="M4 16l5-5 3.5 3.5L20 6" />
    <path d="M14 6h6v6" />
  </>,
  <>
    <path d="M5 6h14v12H5z" />
    <path d="m5 7 7 6 7-6" />
  </>,
];
const buttonIconFallback = <path d="M5 12h14M13 6l6 6-6 6" />;

/** Иконки документных ссылок по порядку: «чистый» лист, лист с текстом. */
const linkIcons = [
  <path key="a" d="M14 3.5V8h4" />,
  <path key="b" d="M8 13h8M8 17h5" />,
];

function sparkPath(values: number[], width: number, height: number) {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values.map((value, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - 2 - ((value - min) / span) * (height - 4),
  }));
  return points
    .map((p, i) => {
      if (!i) return `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const p0 = points[i - 2] ?? points[i - 1];
      const p1 = points[i - 1];
      const p2 = points[i + 1] ?? p;
      const c1x = p1.x + (p.x - p0.x) / 6;
      const c1y = p1.y + (p.y - p0.y) / 6;
      const c2x = p.x - (p2.x - p1.x) / 6;
      const c2y = p.y - (p2.y - p1.y) / 6;
      return `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    })
    .join(" ");
}

function ScreenRows({ items, live }: { items: Instrument[]; live: boolean }) {
  return (
    <ul className={ui.screenRows}>
      {items.map((item) => (
        <li key={item.ticker}>
          <b>{item.ticker}</b>
          <span>{formatSom(item.price)}</span>
          {/* У живых котировок kse.kg изменения по бумаге нет — показываем объём. */}
          {live ? (
            <em>{item.volume ? formatSom(item.volume) : "—"}</em>
          ) : (
            <em data-tone={item.change < 0 ? "down" : item.change > 0 ? "up" : undefined}>{formatChange(item.change)}</em>
          )}
        </li>
      ))}
    </ul>
  );
}

function FooterLaptop({ title }: { title: string }) {
  const { index: indexKse, indexHistory, instruments, live } = useMarketData();
  // Экран ноутбука: бумаги с наибольшим объёмом (в живых данных — сделки за неделю), затем по цене.
  const screen = [...instruments]
    .filter((item) => item.type === "stock" && item.price > 0)
    .sort((a, b) => b.volume - a.volume || b.price - a.price)
    .slice(0, 4);
  const line = sparkPath(
    indexHistory.map((item) => item.index),
    120,
    44,
  );
  return (
    <div className={ui.footerLaptop} aria-hidden="true">
      <div className={ui.laptopLid}>
        <div className={ui.laptopScreen}>
          <div className={ui.laptopIndex}>
            <small>KSE Index</small>
            <b className={ui.screenValue}>{indexKse.value.toLocaleString("ru-KG", { minimumFractionDigits: 2 })}</b>
            <em className={ui.screenChange} data-tone={indexKse.change < 0 ? "down" : "up"}>
              {formatChange(indexKse.change)}
            </em>
            <svg className={ui.screenSpark} viewBox="0 0 120 44" preserveAspectRatio="none">
              <path d={`${line} L120 44 L0 44 Z`} data-fill="true" />
              <path d={line} />
            </svg>
          </div>
          <div className={ui.laptopQuotes}>
            <small>{title}</small>
            <ScreenRows items={screen} live={live} />
          </div>
        </div>
      </div>
      <div className={ui.laptopBase} />
    </div>
  );
}

/** Иконки соцсетей — фирменные цвета на белом круге. */
const socialIcons = {
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#3B5998" />
      <path d="M15.6 8.4h-1.7c-.5 0-.9.4-.9.9v1.6h2.6l-.4 2.6H13V20h-2.7v-6.5H8.4v-2.6h1.9V9c0-2 1.2-3.2 3.1-3.2.9 0 1.8.1 2.2.2v2.4z" fill="#fff" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="kse-ig" cx="30%" cy="107%" r="150%">
          <stop offset="0" stopColor="#fdf497" />
          <stop offset="0.05" stopColor="#fdf497" />
          <stop offset="0.45" stopColor="#fd5949" />
          <stop offset="0.6" stopColor="#d6249f" />
          <stop offset="0.9" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#kse-ig)" />
      <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="3.6" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.8" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="15.6" cy="8.4" r="0.9" fill="#fff" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#2AABEE" />
      <path d="M6.6 11.7l9.6-3.7c.4-.2.9.1.7.8l-1.6 7.7c-.1.6-.5.7-1 .4l-2.6-1.9-1.3 1.2c-.1.1-.3.2-.5.2l.2-2.7 4.9-4.4c.2-.2 0-.3-.3-.1l-6 3.8-2.6-.8c-.6-.2-.6-.6.1-.9z" fill="#fff" />
    </svg>
  ),
};

function RowIcon({ children }: { children: ReactNode }) {
  return (
    <span className={ui.footerIcon} aria-hidden="true">
      {children}
    </span>
  );
}

export function SiteFooter() {
  const { footer, footerButtons, footerLinks, settings } = useSiteNav();
  const { tr } = useApp();
  const phones = splitLines(settings.phones);
  const emails = splitLines(settings.emails);
  const tagline = tr(settings.tagline || "Рынок ценных бумаг Кыргызстана. Котировки, итоги торгов и отчёты эмитентов — в одном месте.");
  const splitAt = tagline.indexOf(". ");
  const headlineLead = splitAt > 0 ? tagline.slice(0, splitAt + 1) : tagline;
  const hotline = phones[0];
  const morePhones = phones.slice(1);

  return (
    <footer className={ui.footer} id="contacts">
      <div className={ui.footerPanel}>
        <nav className={ui.footerNav} aria-label={tr("Разделы сайта")} data-stagger>
          {footer.map((column) => (
            <div key={column.title}>
              <b>{tr(column.title)}</b>
              {column.links.map(([href, label]) => (
                <FooterLink href={href} key={`${href}-${label}`} label={tr(label)} />
              ))}
            </div>
          ))}
        </nav>

        <div className={ui.footerBanner}>
          <FooterLaptop title={tr("Котировки")} />

          <div className={ui.footerBannerCopy}>
            <p>{headlineLead}</p>
            {footerButtons.length ? (
              <div className={ui.footerBadges}>
                {footerButtons.map((item, index) => (
                  <FooterLink href={item.href} key={`${item.href}-${item.label}`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {buttonIcons[index] ?? buttonIconFallback}
                    </svg>
                    <span>{tr(item.label)}</span>
                  </FooterLink>
                ))}
              </div>
            ) : null}
          </div>

          {settings.facebookUrl || settings.instagramUrl || settings.telegramUrl ? (
            <nav className={ui.footerSocial} aria-label={tr("КФБ в соцсетях")}>
              {[
                { href: settings.facebookUrl, label: "Facebook", icon: socialIcons.facebook },
                { href: settings.instagramUrl, label: "Instagram", icon: socialIcons.instagram },
                { href: settings.telegramUrl, label: "Telegram", icon: socialIcons.telegram },
              ]
                .filter((item) => item.href)
                .map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label} title={item.label}>
                    {item.icon}
                  </a>
                ))}
            </nav>
          ) : null}
        </div>

        <div className={ui.footerMeta}>
          <div className={ui.footerHotline}>
            {hotline ? (
              <>
                <RowIcon>
                  <svg viewBox="0 0 24 24">
                    <path d="M8 4h3l1.4 3.6-2 1.2a12 12 0 0 0 5 5l1.2-2L20 13.2V17a2 2 0 0 1-2.2 2A14 14 0 0 1 5 6.2 2 2 0 0 1 7 4z" />
                  </svg>
                </RowIcon>
                <a href={telHref(hotline)}>{hotline}</a>
              </>
            ) : null}
          </div>

          <div className={ui.footerRows}>
            {morePhones.length ? (
              <div>
                <RowIcon>
                  <svg viewBox="0 0 24 24">
                    <path d="M8 4h3l1.4 3.6-2 1.2a12 12 0 0 0 5 5l1.2-2L20 13.2V17a2 2 0 0 1-2.2 2A14 14 0 0 1 5 6.2 2 2 0 0 1 7 4z" />
                  </svg>
                </RowIcon>
                <div>
                  <b>{tr("Телефон")}</b>
                  {morePhones.map((phone) => (
                    <a href={telHref(phone)} key={phone}>
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            {footerLinks.map((item, index) => (
              <div key={`${item.href}-${item.label}`}>
                <RowIcon>
                  <svg viewBox="0 0 24 24">
                    <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" />
                    {linkIcons[index % linkIcons.length]}
                  </svg>
                </RowIcon>
                <FooterLink href={item.href} label={tr(item.label)} />
              </div>
            ))}
          </div>

          <div className={ui.footerRows}>
            {settings.address ? (
              <div>
                <RowIcon>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.1" />
                  </svg>
                </RowIcon>
                <div>
                  <b>{tr("Адрес")}</b>
                  <p>{tr(settings.address)}</p>
                </div>
              </div>
            ) : null}
            {emails.length ? (
              <div>
                <RowIcon>
                  <svg viewBox="0 0 24 24">
                    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                </RowIcon>
                <div>
                  <b>{tr("E-mail")}</b>
                  {emails.map((email) => (
                    <a href={mailHref(email)} key={email}>
                      {email}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={ui.footerBottom}>
        <span>{tr(settings.copyright || "© 2004–2026 ЗАО «Кыргызская фондовая биржа»")}</span>
        <Link href="/admin">{tr("Админ-панель")}</Link>
      </div>
    </footer>
  );
}
