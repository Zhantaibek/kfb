"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useApp } from "@/components/AppProviders";
import { mailHref, splitLines, telHref } from "@/lib/cms/contacts";
import { useSiteNav } from "@/lib/cms/use-site-nav";
import ui from "@/app/ui.module.css";

export function SiteFooter() {
  const { footer, settings } = useSiteNav();
  const { tr } = useApp();
  const phones = splitLines(settings.phones);
  const emails = splitLines(settings.emails);

  return (
    <footer className={ui.footer} id="contacts">
      <div className={ui.footerTop}>
        <div className={ui.footerBrand}>
          <Link className={ui.brand} href="/" aria-label={tr("Кыргызская фондовая биржа — главная")}>
            <Logo variant="lockup" className={ui.logoLockup} />
          </Link>
          <p>{tr(settings.tagline || "Организатор торгов с 1994 года. Лицензия №37 НКРЦБ.")}</p>
        </div>

        <nav className={ui.footerNav} aria-label={tr("Разделы сайта")}>
          {footer.map((column) => (
            <div key={column.title}>
              <b>{tr(column.title)}</b>
              {column.links.map(([href, label]) =>
                /^https?:\/\//i.test(href) ? (
                  <a href={href} key={`${href}-${label}`} target="_blank" rel="noopener noreferrer">
                    {tr(label)}
                  </a>
                ) : (
                  <Link href={href} key={`${href}-${label}`}>
                    {tr(label)}
                  </Link>
                ),
              )}
            </div>
          ))}

          <address>
            <b>{tr("Контакты")}</b>
            {settings.address ? <p>{tr(settings.address)}</p> : null}
            {phones.map((phone) => (
              <a href={telHref(phone)} key={phone}>
                {phone}
              </a>
            ))}
            {emails.map((email) => (
              <a href={mailHref(email)} key={email}>
                {email}
              </a>
            ))}
            <Link href="/contacts">{tr("Написать в КФБ")}</Link>
          </address>
        </nav>
      </div>

      <div className={ui.footerBottom}>
        <span>{tr(settings.copyright || "© 2004–2026 ЗАО «Кыргызская фондовая биржа»")}</span>
        <div>
          <Link href="/documents">{tr("Правила и тарифы")}</Link>
          <Link href="/disclosure">{tr("Раскрытие")}</Link>
          <Link href="/admin">{tr("Админ-панель")}</Link>
        </div>
      </div>
    </footer>
  );
}
