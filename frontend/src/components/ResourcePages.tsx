"use client";

import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { partnerFields, paragraphs } from "@/lib/cms/partners";
import { useLocalized, useLocalizedList } from "@/lib/cms/use-localized";
import type { CmsPartner } from "@/lib/cms/types";
import ui from "@/app/ui.module.css";
import { useTr } from "@/lib/use-tr";
import styles from "./ResourcePages.module.css";

/** /about/partners — все партнёры из админки. */
export function ResourceDirectory({ partners }: { partners: CmsPartner[] }) {
  const tr = useTr();
  const list = useLocalizedList(partners, [...partnerFields]);
  return (
    <main className={ui.wrap}>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / {tr("Наши партнеры")}
          </>
        }
        title="Наши партнеры"
        lead="Кратко о каждом партнёре биржи."
      />
      <div className={styles.list}>
        {list.map((item) => (
          <Link className={styles.item} href={`/about/partners/${item.slug}`} key={item.slug}>
            <span>
              <b>
                {item.mark} · {item.caption}
              </b>
              <small>{item.name}</small>
              <p>{item.lead}</p>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

/** /about/partners/[slug] — страница партнёра. */
export function ResourceDetail({ item: raw, partners }: { item: CmsPartner; partners: CmsPartner[] }) {
  const tr = useTr();
  const item = useLocalized(raw, [...partnerFields]);
  const others = useLocalizedList(
    partners.filter((entry) => entry.slug !== raw.slug),
    [...partnerFields],
  );
  return (
    <main className={ui.wrap}>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / <Link href="/about/partners">{tr("Наши партнеры")}</Link> / {item.caption}
          </>
        }
        title={item.caption}
        lead={item.name}
      />
      <div className={ui.grid}>
        <article className={ui.card}>
          <p>{item.lead}</p>
          {paragraphs(item.body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            {item.site ? (
              <>
                <a href={item.site} target="_blank" rel="noopener noreferrer">
                  {tr("Официальный сайт")} ↗
                </a>
                {" · "}
              </>
            ) : null}
            <Link href="/about/partners">{tr("Все партнеры")}</Link>
          </p>
        </article>
        <aside className={ui.card}>
          <h2>{tr("Другие ресурсы")}</h2>
          <ul className={styles.side}>
            {others.map((entry) => (
              <li key={entry.slug}>
                <Link href={`/about/partners/${entry.slug}`}>
                  {entry.mark} · {entry.caption}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
