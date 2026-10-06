"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProviders";
import { formatChange, formatSom, indexHistory, indexKse, instruments } from "@/data/catalog";
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

const screenStocks = instruments
  .filter((item) => item.type === "stock")
  .sort((a, b) => b.volume - a.volume)
  .slice(0, 5);

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

function ScreenRows({ count }: { count: number }) {
  return (
    <ul className={ui.screenRows}>
      {screenStocks.slice(0, count).map((item) => (
        <li key={item.ticker}>
          <b>{item.ticker}</b>
          <span>{formatSom(item.price)}</span>
          <em data-tone={item.change < 0 ? "down" : item.change > 0 ? "up" : undefined}>{formatChange(item.change)}</em>
        </li>
      ))}
    </ul>
  );
}

function FooterLaptop({ title }: { title: string }) {
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
            <ScreenRows count={4} />
          </div>
        </div>
      </div>
      <div className={ui.laptopBase} />
    </div>
  );
}

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
