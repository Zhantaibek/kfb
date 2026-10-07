import type { Metadata } from "next";
import { GcbView } from "@/components/landing/GcbView";
import { loadPublicContent } from "@/lib/cms/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Инвестиции в ГЦБ",
  description: "Государственные ценные бумаги ГКВ-12 и ГКО-2 на Кыргызской фондовой бирже: доходность, как купить, участники торгов.",
};

/** Новости с этим тегом показываются в блоке «Актуальные новости по ГЦБ». */
const gcbNewsTag = "ГЦБ";

/** Лендинг kse.kg/gsb.html: тексты, брокеры и банки, новости — из админки. */
export default async function GcbInvestPage() {
  const content = await loadPublicContent();
  return (
    <main>
      <GcbView
        sections={content.landingSections}
        participants={content.gcbParticipants}
        news={content.news.filter((item) => item.tag === gcbNewsTag)}
      />
    </main>
  );
}
