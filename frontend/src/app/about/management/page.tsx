import Link from "next/link";
import { CmsPageView } from "@/components/CmsPageView";
import { PageIntro } from "@/components/Forms";
import { ManagementList } from "@/components/ManagementList";
import { PublicMain } from "@/components/PublicMain";
import { sectionPages } from "@/data/site-nav";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";
import { pageMetadata } from "@/lib/seo-server";

const path = "/about/management";
const section = sectionPages[path];

export const dynamic = "force-dynamic";
export const generateMetadata = pageMetadata(section.title, section.lead);

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
