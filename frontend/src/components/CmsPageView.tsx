"use client";

import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { RichHtml } from "@/components/RichHtml";
import { PublicMain } from "@/components/PublicMain";
import { useLocalized } from "@/lib/cms/use-localized";
import type { CmsPage } from "@/lib/cms/types";
import ui from "@/app/ui.module.css";

export function CmsPageView({ page }: { page: CmsPage }) {
  const loc = useLocalized(page, ["title", "lead", "body"]);
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / {loc.title}
          </>
        }
        title={loc.title}
        lead={loc.lead}
      />
      <article className={ui.card}>
        <RichHtml html={loc.body} />
      </article>
    </PublicMain>
  );
}
