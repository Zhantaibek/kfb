import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPageView } from "@/components/CmsPageView";
import { SectionView } from "@/components/SectionView";
import { sectionPages } from "@/data/site-nav";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";

export function makeSectionPage(path: string) {
  const content = sectionPages[path];
  if (!content) throw new Error(`Missing section content for ${path}`);

  return {
    metadata: { title: content.title } satisfies Metadata,
    async Page() {
      return <SectionPageByPath path={path} />;
    },
  };
}

export async function SectionPageByPath({ path }: { path: string }) {
  const page = findPageByPath(await loadPublicContent(), path);
  if (page) return <CmsPageView page={page} />;
  const content = sectionPages[path];
  if (!content) notFound();
  return <SectionView {...content} />;
}
