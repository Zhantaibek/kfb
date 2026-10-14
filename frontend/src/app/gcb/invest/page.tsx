import { GcbView } from "@/components/landing/GcbView";
import { loadPublicContent } from "@/lib/cms/public";
import { pageMetadata } from "@/lib/seo-server";

export const dynamic = "force-dynamic";
export const generateMetadata = pageMetadata("Инвестиции в ГЦБ", "Государственные ценные бумаги ГКВ-12 и ГКО-2 на Кыргызской фондовой бирже: доходность, как купить, участники торгов.");

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
