import { HomeView } from "@/components/HomeView";
import { isGeneralNews } from "@/lib/cms/types";
import { loadPublicContent } from "@/lib/cms/public";
import {
  auctions,
  disclosures,
  indexHistory,
  indexKse,
  instruments,
  members,
  sessionDate,
  sessionHours,
  stats,
} from "@/data/catalog";

export const dynamic = "force-dynamic";

const gold = instruments.find((item) => item.ticker === "GOLDB1");
const stocks = instruments.filter((item) => item.type === "stock").length;
const bonds = instruments.filter((item) => item.type === "bond").length;
const gcb = instruments.filter((item) => item.type === "gcb").length;
const metals = instruments.filter((item) => item.type === "metal").length;
const nextAuction = auctions.find((item) => item.status !== "Состоялся");

const fallbackHubs = [
  { href: "/market", title: "Торги и котировки", text: `${instruments.length} инструментов, лидеры сессии и фильтры`, photo: "/hub/hub-market.jpg" },
  { href: "/news", title: "Новости", text: "Пресс-центр биржи, эмитенты и срочные объявления", photo: "/hub/hub-news.jpg" },
  { href: "/disclosure", title: "Раскрытие", text: `${disclosures.length} свежих фактов эмитентов`, photo: "/hub/hub-disclosure.jpg" },
  { href: "/gcb", title: "Аукционы ГЦБ", text: nextAuction ? `Ближайший: ${nextAuction.date} · ${nextAuction.type}` : "Календарь Минфина", photo: "/hub/hub-gcb.jpg" },
  { href: "/listing", title: "Листинг", text: `${stocks} акций · ${bonds} облигаций`, photo: "/hub/hub-listing.jpg" },
  { href: "/members", title: "Участники торгов", text: `${members.length} компаний`, photo: "/hub/hub-members.jpg" },
  { href: "/analytics", title: "Аналитика", text: `Индекс KSE ${indexKse.value.toFixed(2)}`, photo: "/hub/hub-analytics.jpg" },
  { href: "/education", title: "Учебный центр", text: "Курсы, план работы и онлайн-платформа", photo: "/hub/hub-education.jpg" },
];

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
  const content = await loadPublicContent();
  const settings = content.settings;
  const hubs = content.hubs?.length ? content.hubs : fallbackHubs;
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
        news={content.news.filter(isGeneralNews).slice(0, 4)}
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
        hubs={hubs}
      />
    </>
  );
}
