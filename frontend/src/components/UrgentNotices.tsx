"use client";

import Link from "next/link";
import { applyLocale } from "@/lib/cms/locale";
import type { CmsI18n } from "@/lib/cms/types";
import { useLang, useTr } from "@/lib/use-tr";
import { AdminEditButton } from "@/components/AdminEditButton";
import css from "./UrgentNotices.module.css";

export type UrgentNotice = {
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  i18n?: CmsI18n;
};

/**
 * Срочные объявления — новости с отметкой «Пометить как срочную» в админке.
 * Есть хотя бы одно опубликованное — блок показывается внизу главной, перед подвалом; нет — блока нет совсем.
 */
export function UrgentNotices({ items }: { items: UrgentNotice[] }) {
  const tr = useTr();
  const lang = useLang();
  if (!items.length) return null;
  const notices = items.map((item) => applyLocale(item, lang, ["title", "excerpt"]));

  return (
    <section className={css.urgent} aria-labelledby="urgent-title" role="region">
      <header className={css.head}>
        <span className={css.badge}>
          <span className={css.pulse} aria-hidden="true" />
          {tr("Срочно")}
        </span>
        <h2 id="urgent-title">{tr(notices.length > 1 ? "Срочные объявления" : "Срочное объявление")}</h2>
        <AdminEditButton href="/admin/news" />
      </header>
      <ul className={css.list}>
        {notices.map((item) => (
          <li key={item.slug}>
            <Link href={`/news/${item.slug}`} className={css.item}>
              <time>{item.date}</time>
              <span className={css.body}>
                <b>{item.title}</b>
                {item.excerpt ? <span>{item.excerpt}</span> : null}
              </span>
              <span className={css.more}>{tr("Подробнее")} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
