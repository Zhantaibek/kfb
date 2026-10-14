import { pageMetadata } from "@/lib/seo-server";
import { SectionPageByPath } from "@/components/SectionPage";
import { sectionPages } from "@/data/site-nav";

const path = "/about/committees/strategy";

export const generateMetadata = pageMetadata(sectionPages[path].title, sectionPages[path].lead);

export default function Page() {
  return <SectionPageByPath path={path} />;
}
