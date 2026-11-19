import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
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
      {/* Документов в админке ещё нет — без выдуманного списка. */}
      <article className={ui.card}>
        <p>Документы готовятся к публикации.</p>
      </article>
    </PublicMain>
  );
}
