"use client";

import Link from "next/link";
import { useLocalizedList } from "@/lib/cms/use-localized";
import { mediaSrc } from "@/lib/cms/media-src";
import type { CmsNews } from "@/lib/cms/types";
import { useTr } from "@/lib/use-tr";
import css from "./NewsList.module.css";

/**
 * Новости из CMS в раскладке редакции: главная новость — крупный бирюзовый блок (или фото),
 * рядом колонка «Также» из следующих четырёх, остальные — карточками ниже.
 */
export function NewsList({ items }: { items: CmsNews[] }) {
  const tr = useTr();
  const rows = useLocalizedList(items, ["title", "excerpt", "tag"]);
  if (!rows.length) return null;
  const [lead, ...others] = rows;
  const side = others.slice(0, 4);
  const rest = others.slice(4);

  const meta = (item: (typeof rows)[number]) => (
    <span className={css.meta}>
      {item.tag ? <b>{tr(item.tag)}</b> : null}
      <span>{item.date}</span>
    </span>
  );

  return (
    <div className={css.news}>
      <div className={side.length ? css.top : `${css.top} ${css.single}`}>
        <Link className={`${css.lead} ${lead.photo ? css.withPhoto : ""}`} href={`/news/${lead.slug}`}>
          {lead.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- фото из медиатеки CMS, размеры неизвестны
            <img className={css.leadPhoto} src={mediaSrc(lead.photo)} alt="" />
          ) : null}
          <span className={css.leadBody}>
            {meta(lead)}
            <span className={css.leadTitle}>{tr(lead.title)}</span>
            {lead.excerpt ? <span className={css.leadText}>{tr(lead.excerpt)}</span> : null}
            <span className={css.leadMore}>{tr("Читать далее")} →</span>
          </span>
        </Link>

        {side.length ? (
          <div className={css.side}>
            <p className={css.sideLabel}>{tr("Также")}</p>
            {side.map((item) => (
              <Link className={css.sideItem} href={`/news/${item.slug}`} key={item.slug}>
                {meta(item)}
                <span className={css.sideTitle}>{tr(item.title)}</span>
                {item.excerpt ? <span className={css.sideText}>{tr(item.excerpt)}</span> : null}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {rest.length ? (
        <div className={css.rest}>
          {rest.map((item) => (
            <Link className={css.card} href={`/news/${item.slug}`} key={item.slug}>
              {meta(item)}
              <span className={css.sideTitle}>{tr(item.title)}</span>
              {item.excerpt ? <span className={css.sideText}>{tr(item.excerpt)}</span> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
