import Link from "next/link";
import type { Metadata } from "next";
import { CmsPageView } from "@/components/CmsPageView";
import { PageIntro } from "@/components/Forms";
import { ManagementList } from "@/components/ManagementList";
import { PublicMain } from "@/components/PublicMain";
import { sectionPages } from "@/data/site-nav";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";

const path = "/about/management";
const section = sectionPages[path];

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: section.title };

export default async function ManagementPage() {
  const content = await loadPublicContent();
  const page = findPageByPath(content, path);
  if (page) return <CmsPageView page={page} />;

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / <Link href="/about">О нас</Link> / {section.title}
          </>
        }
        title={section.title}
        lead={section.lead}
      />
      <ManagementList people={content.management} />
    </PublicMain>
  );
}
