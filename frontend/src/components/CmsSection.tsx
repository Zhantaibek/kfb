"use client";

import { RichHtml } from "@/components/RichHtml";
import { useLocalized } from "@/lib/cms/use-localized";
import { useTr } from "@/lib/use-tr";
import type { CmsPage } from "@/lib/cms/types";
import ui from "@/app/ui.module.css";

/**
 * Текст страницы из админки внутри страницы со своим интерфейсом (контакты, учебный центр):
 * заголовок блока и тело на текущем языке. Нет страницы в базе — блока нет.
 */
export function CmsSection({ page, title }: { page: CmsPage | null | undefined; title: string }) {
  const tr = useTr();
  if (!page) return null;
  return <CmsSectionBody page={page} title={tr(title)} />;
}

function CmsSectionBody({ page, title }: { page: CmsPage; title: string }) {
  const loc = useLocalized(page, ["body"]);
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: "clamp(22px, 2.2vw, 28px)" }}>{title}</h2>
      <article className={ui.card}>
        <RichHtml html={loc.body} />
      </article>
    </section>
  );
}
