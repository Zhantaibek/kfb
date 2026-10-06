"use client";

import Image from "next/image";
import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { RichHtml } from "@/components/RichHtml";
import { PublicMain } from "@/components/PublicMain";
import { mediaSrc } from "@/lib/cms/media-src";
import { useLocalized } from "@/lib/cms/use-localized";
import type { CmsNews } from "@/lib/cms/types";
import ui from "@/app/ui.module.css";

/** issuer — эмитент новости компании (для хлебных крошек), страница находит его на сервере. */
export function NewsArticle({ item, issuer }: { item: CmsNews; issuer?: { slug: string; name: string } }) {
  const loc = useLocalized(item, ["title", "excerpt", "body", "tag"]);
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
      </article>
    </PublicMain>
  );
}
