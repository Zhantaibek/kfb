"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteNav } from "@/lib/cms/use-site-nav";
import { useTr } from "@/lib/use-tr";
import styles from "./ResourceRail.module.css";

/** «Наши партнеры» на главной — из админки (раздел «Партнёры»), тексты уже на текущем языке. */
/** «http://www.nbkr.kg/» → «nbkr.kg» — короткий адрес сайта партнёра для подписи ссылки. */
export function siteHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
  }
}

export function ResourceRail() {
  const tr = useTr();
  const { partners } = useSiteNav();

  return (
    <section className={styles.wrap} aria-labelledby="resources-title">
      <div className={styles.head}>
        <div>
          <h2 id="resources-title">{tr("Наши партнеры")}</h2>
          <p>{tr("Регуляторы, инфраструктура и биржи-партнёры, с которыми работает КФБ")}</p>
        </div>
        <Link className={styles.all} href="/about/partners">
          {tr("Все партнеры")} <span aria-hidden="true">→</span>
        </Link>
      </div>
      <ul className={styles.grid}>
        {partners.map((item) => {
          return (
            <li key={item.slug}>
              {/* Карточка ведёт на страницу партнёра (ссылка в заголовке растянута на всю карточку), а «сайт ↗» — на его сайт. */}
              <div className={styles.card}>
                <span className={styles.top}>
                  <span className={styles.logo} data-wide={item.logoWide ? "true" : undefined}>
                    {item.logo ? <Image src={item.logo} alt={item.mark} fill sizes="160px" unoptimized /> : <b>{item.mark}</b>}
                  </span>
                  <span className={styles.meta}>
                    <em>{item.mark}</em>
                    <span>{item.kind}</span>
                  </span>
                </span>
                <b>
                  <Link href={`/about/partners/${item.slug}`} className={styles.cardLink}>
                    {item.caption}
                  </Link>
                </b>
                <small>{item.lead}</small>
                <span className={styles.actions}>
                  <span className={styles.more}>
                    {tr("Подробнее")}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                  {item.site ? (
                    <a className={styles.site} href={item.site} target="_blank" rel="noopener noreferrer">
                      {siteHost(item.site)} ↗
                    </a>
                  ) : null}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
