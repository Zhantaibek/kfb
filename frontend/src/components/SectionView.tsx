"use client";

import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import type { SectionContent } from "@/data/site-nav";
import ui from "@/app/ui.module.css";
import { useTr } from "@/lib/use-tr";

export function SectionView({ title, lead, crumb, body, links }: SectionContent) {
  const tr = useTr();
  return (
    <main className={ui.wrap}>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / {crumb}
          </>
        }
        title={title}
        lead={lead}
      />
      <div className={ui.grid}>
        <article className={ui.card}>
          {body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{tr(paragraph)}</p>
          ))}
        </article>
        {links && links.length > 0 ? (
          <aside className={ui.card}>
            <h2>{tr("Связанные разделы")}</h2>
            <ul>
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{tr(item.label)}</Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
