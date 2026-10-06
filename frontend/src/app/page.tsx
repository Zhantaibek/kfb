import { HomeView } from "@/components/HomeView";
import { isGeneralNews } from "@/lib/cms/types";
import { findIssuer, loadIssuerData, loadPublicContent } from "@/lib/cms/public";
import {
  indexHistory,
  indexKse,
  instruments,
  sessionDate,
  sessionHours,
  stats,
} from "@/data/catalog";

export const dynamic = "force-dynamic";

const gold = instruments.find((item) => item.ticker === "GOLDB1");
const stocks = instruments.filter((item) => item.type === "stock").length;
const gcb = instruments.filter((item) => item.type === "gcb").length;
const metals = instruments.filter((item) => item.type === "metal").length;

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
  const [content, issuerData] = await Promise.all([loadPublicContent(), loadIssuerData()]);
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
        news={content.news.filter(isGeneralNews).slice(0, 4).map((item) => ({
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
        session={{ ...session, hours: sessionHours, date: sessionDate }}
        index={{
          value: indexKse.value,
          change: indexKse.change,
          history: indexHistory.map((item) => item.index),
          capitalization: indexKse.capitalization,
        }}
        volume={{ value: stats.volumeMln, change: stats.volumeChange, trades: stats.trades }}
        listing={{ total: instruments.length, stocks, gcb, metals }}
        gold={gold ? { price: gold.price, change: gold.change } : undefined}
      />
    </>
  );
}
