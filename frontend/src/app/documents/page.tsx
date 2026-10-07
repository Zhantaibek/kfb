import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { regulations } from "@/data/catalog";
import { CmsPageView } from "@/components/CmsPageView";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Корпоративные документы" };

export default async function DocumentsPage() {
  // Устав, положения и т.д. — страница /documents в админке (перенесена с kse.kg).
  const page = findPageByPath(await loadPublicContent(), "/documents");
  if (page) return <CmsPageView page={page} />;

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Документы
          </>
        }
        title="Нормативная база"
        lead="Правила биржевой и депозитарной деятельности, листинг и раскрытие информации."
      />
      <div className={ui.list}>
        {regulations.map((item) => (
          <article className={ui.row} key={item.title}>
            <small>{item.group}</small>
            <h3>{item.title}</h3>
            <p>Документ доступен в демо-режиме. На боевом сайте КФБ файлы публикуются в PDF.</p>
          </article>
        ))}
      </div>
    </PublicMain>
  );
}
