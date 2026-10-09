import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { CmsSection } from "@/components/CmsSection";
import { HubCards } from "@/components/landing/HubCards";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";
import { PublicMain } from "@/components/PublicMain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Общая информация" };

/** «О Бирже» как на kse.kg/ru/GeneralInfo: раздел из карточек; текст страницы /about из админки — ниже. */
export default async function AboutPage() {
  const content = await loadPublicContent();
  const page = findPageByPath(content, "/about");

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / О Бирже
          </>
        }
        title="Общая информация"
      />
      <HubCards items={content.menu} page="/about" />
      <CmsSection page={page} title="О бирже" />
    </PublicMain>
  );
}
