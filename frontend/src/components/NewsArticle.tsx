"use client";

import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { RichHtml } from "@/components/RichHtml";
import { PublicMain } from "@/components/PublicMain";
import { mediaSrc } from "@/lib/cms/media-src";
import { formatFileSize } from "@/lib/news-content";
import { useTr } from "@/lib/use-tr";
import { useLocalized } from "@/lib/cms/use-localized";
import type { CmsNews } from "@/lib/cms/types";
import ui from "@/app/ui.module.css";

/** issuer — эмитент новости компании (для хлебных крошек), страница находит его на сервере. */
export function NewsArticle({ item, issuer }: { item: CmsNews; issuer?: { slug: string; name: string } }) {
  const loc = useLocalized(item, ["title", "excerpt", "body", "tag"]);
  const tr = useTr();
  const attachments = item.attachments ?? [];
  return (
    <PublicMain>
      <PageIntro
        crumb={
          issuer ? (
            <>
              <Link href="/">Главная</Link> / <Link href="/disclosure">Центр раскрытия информации</Link> /{" "}
              <Link href={`/disclosure/${issuer.slug}`}>{issuer.name}</Link> / {loc.tag}
            </>
          ) : (
            <>
              <Link href="/">Главная</Link> / <Link href="/news">Новости</Link> / {loc.tag}
            </>
          )
        }
        title={loc.title}
        lead={`${loc.date} · ${loc.tag}`}
      />
      {loc.photo ? (
        <div className={ui.card} style={{ overflow: "hidden", padding: 0, marginBottom: 16 }}>
          <div style={{ position: "relative", height: 320 }}>
            <Image src={mediaSrc(loc.photo)} alt="" fill sizes="1200px" style={{ objectFit: "cover" }} unoptimized />
          </div>
        </div>
      ) : null}
      <article className={ui.card}>
        <RichHtml html={loc.body} />
        {attachments.length ? (
          <section className={ui.newsDocs} aria-labelledby="news-docs">
            <h2 id="news-docs">{tr("Документы")}</h2>
            <ul>
              {attachments.map((doc) => (
                <li key={doc.url}>
                  <a href={mediaSrc(doc.url)} target="_blank" rel="noopener noreferrer" download>
                    <span className={ui.newsDocExt}>{doc.ext.toUpperCase()}</span>
                    <span>
                      <b>{doc.name}</b>
                      <small>
                        {doc.ext.toUpperCase()}
                        {doc.size ? ` · ${formatFileSize(doc.size)}` : ""}
                      </small>
                    </span>
                    <span className={ui.newsDocAction}>{tr("Скачать")}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </PublicMain>
  );
}
