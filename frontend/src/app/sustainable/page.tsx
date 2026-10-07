import type { Metadata } from "next";
import { SustainableView } from "@/components/landing/SustainableView";
import { loadPublicContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Сектор устойчивого развития",
  description: "Сектор устойчивого развития КФБ: зелёные и социальные облигации, ESG-отчётность, верификаторы.",
};

/** Лендинг kse.kg/sustainable.html: тексты, бумаги, верификаторы и ESG-отчёты — из админки. */
export default async function SustainablePage() {
  const content = await loadPublicContent();
  return (
    <main>
      <SustainableView
        sections={content.landingSections}
        bonds={content.sustainableBonds}
        reports={content.esgReports}
        verifiers={content.verifiers}
      />
    </main>
  );
}
