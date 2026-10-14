import { ResourceDirectory } from "@/components/ResourcePages";
import { partnersOrFallback } from "@/lib/cms/partners";
import { loadPublicContent } from "@/lib/cms/public";
import { pageMetadata } from "@/lib/seo-server";

export const dynamic = "force-dynamic";
export const generateMetadata = pageMetadata("Наши партнеры");

export default async function Page() {
  const { partners } = await loadPublicContent();
  return <ResourceDirectory partners={partnersOrFallback(partners)} />;
}
