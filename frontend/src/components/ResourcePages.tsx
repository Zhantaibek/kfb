"use client";

import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { resourceProfiles, type ResourceProfile } from "@/data/resources";
import ui from "@/app/ui.module.css";
import { useTr } from "@/lib/use-tr";
import styles from "./ResourcePages.module.css";

export function ResourceDirectory() {
  const tr = useTr();
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
        {resourceProfiles.map((item) => (
          <Link className={styles.item} href={`/about/partners/${item.slug}`} key={item.slug}>
            <span>
              <b>
                {item.mark} · {tr(item.caption)}
              </b>
              <small>{tr(item.name)}</small>
              <p>{tr(item.lead)}</p>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function ResourceDetail({ item }: { item: ResourceProfile }) {
  const tr = useTr();
  const others = resourceProfiles.filter((entry) => entry.slug !== item.slug);
  return (
    <main className={ui.wrap}>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / <Link href="/about/partners">{tr("Наши партнеры")}</Link> / {tr(item.caption)}
          </>
        }
        title={item.caption}
        lead={item.name}
      />
      <div className={ui.grid}>
        <article className={ui.card}>
          <p>{tr(item.lead)}</p>
          {item.body.map((paragraph) => (
            <p key={paragraph}>{tr(paragraph)}</p>
          ))}
          <p>
            <Link href="/about/partners">{tr("Все партнеры")}</Link>
          </p>
        </article>
        <aside className={ui.card}>
          <h2>{tr("Другие ресурсы")}</h2>
          <ul className={styles.side}>
            {others.map((entry) => (
              <li key={entry.slug}>
                <Link href={`/about/partners/${entry.slug}`}>
                  {entry.mark} · {tr(entry.caption)}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
