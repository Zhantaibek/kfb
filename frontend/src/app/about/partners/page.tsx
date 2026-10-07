import type { Metadata } from "next";
import { ResourceDirectory } from "@/components/ResourcePages";
import { partnersOrFallback } from "@/lib/cms/partners";
import { loadPublicContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Наши партнеры" };

export default async function Page() {
  const { partners } = await loadPublicContent();
  return <ResourceDirectory partners={partnersOrFallback(partners)} />;
}
