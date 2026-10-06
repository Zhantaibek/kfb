"use client";

import Image from "next/image";
import Link from "next/link";
import { resourceProfiles } from "@/data/resources";
import { useTr } from "@/lib/use-tr";
import styles from "./ResourceRail.module.css";

const logos: Record<string, { src: string; wide?: boolean }> = {
  gfr: { src: "/partners/gfr.png" },
  gaugi: { src: "/partners/gaugi.png" },
  mab: { src: "/partners/mab.svg" },
  nbkr: { src: "/partners/nbkr.png" },
  kase: { src: "/partners/kase.svg", wide: true },
  bist: { src: "/partners/bist.png", wide: true },
  rkfr: { src: "/partners/rkfr.png" },
  cd: { src: "/partners/cd.png", wide: true },
};

export function ResourceRail() {
  const tr = useTr();

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
        {resourceProfiles.map((item) => {
          const logo = logos[item.slug];
          return (
            <li key={item.slug}>
              <Link href={`/about/partners/${item.slug}`} className={styles.card}>
                <span className={styles.top}>
                  <span className={styles.logo} data-wide={logo?.wide ? "true" : undefined}>
                    {logo ? <Image src={logo.src} alt={item.mark} fill sizes="160px" unoptimized /> : <b>{item.mark}</b>}
                  </span>
                  <span className={styles.meta}>
                    <em>{item.mark}</em>
                    <span>{tr(item.kind)}</span>
                  </span>
                </span>
                <b>{tr(item.caption)}</b>
                <small>{tr(item.lead)}</small>
                <span className={styles.more}>
                  {tr("Подробнее")}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
