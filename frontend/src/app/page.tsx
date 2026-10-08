import { HomeView } from "@/components/HomeView";
import { isGeneralNews } from "@/lib/cms/types";
import { findIssuer, loadIssuerData, loadPublicContent } from "@/lib/cms/public";
import { loadMarketData } from "@/lib/market-data";

export const dynamic = "force-dynamic";

/** «ДД.ММ.ГГГГ» → «ГГГГ-ММ-ДД» для сортировки по дате. */
function dateKey(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

function bishkekSession() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bishkek",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const weekend = parts.weekday === "Sat" || parts.weekday === "Sun";
  const open = !weekend && minutes >= 9 * 60 && minutes < 17 * 60;
  return {
    open,
    clock: `${parts.hour}:${parts.minute}`,
    label: open ? "Сессия открыта" : "Сессия закрыта",
  };
}

export default async function Home() {
  const [content, issuerData, market] = await Promise.all([loadPublicContent(), loadIssuerData(), loadMarketData()]);
  // Рынок — живые данные kse.kg (или демо, пока их нет).
  const { instruments } = market;
  const count = (type: string) => instruments.filter((item) => item.type === type).length;
  const gold = instruments.find((item) => item.type === "metal" && item.price > 0);
  const settings = content.settings;
  const session = bishkekSession();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Кыргызская фондовая биржа",
    alternateName: "Kyrgyz Stock Exchange",
    url: "https://kse.kg",
    foundingDate: "1994",
    email: settings?.emails.split("\n")[0]?.trim() || "office@kse.kg",
    telephone: settings?.phones.split("\n")[0]?.replace(/[^\d+]/g, "") || "+996312311484",
    address: { "@type": "PostalAddress", addressLocality: "Бишкек", addressCountry: "KG" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <HomeView
        slides={content.slides}
        urgent={content.news
          .filter((item) => item.kind === "urgent" && item.status === "published")
          .sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)))
          .map((item) => ({ slug: item.slug, date: item.date, title: item.title, excerpt: item.excerpt, i18n: item.i18n }))}
        // Срочные — в своём блоке выше, в ленте «Будьте в курсе» их не повторяем.
        news={content.news.filter((item) => isGeneralNews(item) && item.kind !== "urgent").slice(0, 4).map((item) => ({
          slug: item.slug,
          tag: item.tag,
          date: item.date,
          title: item.title,
          excerpt: item.excerpt,
          photo: item.photo,
          i18n: item.i18n,
        }))}
        companyNews={content.news
          .filter((item) => item.kind === "company" && item.status === "published")
          .slice(0, 4)
          .map((item) => ({
            slug: item.slug,
            tag: item.tag,
            date: item.date,
            title: item.title,
            excerpt: item.excerpt,
            photo: item.photo,
            i18n: item.i18n,
            company: (item.issuerSlug && findIssuer(issuerData, item.issuerSlug)?.name) || item.tag,
          }))}
        session={{ ...session, hours: market.sessionHours, date: market.sessionDate }}
        index={{
          value: market.index.value,
          change: market.index.change,
          history: market.indexHistory.map((item) => item.index),
          capitalization: market.index.capitalization,
        }}
        volume={{ value: market.stats.volumeMln, change: market.stats.volumeChange, trades: market.stats.trades }}
        listing={{ total: instruments.length, stocks: count("stock"), gcb: count("gcb"), metals: count("metal") }}
        gold={gold ? { price: gold.price, change: gold.change } : undefined}
      />
    </>
  );
}
