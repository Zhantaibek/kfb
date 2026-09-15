import type { Metadata } from "next";
import { SectionPageByPath } from "@/components/SectionPage";
import { sectionPages } from "@/data/site-nav";

const path = "/regulations/depository";

export const metadata: Metadata = { title: sectionPages[path].title };

export default function Page() {
  return <SectionPageByPath path={path} />;
}
