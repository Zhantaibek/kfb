import type { InstrumentType } from "@/data/catalog";
import { partnersOrFallback } from "@/lib/cms/partners";
import { findIssuer, loadIssuerData, loadPublicContent } from "@/lib/cms/public";
import { isGeneralNews, type CmsNews } from "@/lib/cms/types";
import { instrumentHref, loadMarketData } from "@/lib/market-data";
import { dateKey, session } from "./data";

// Обложки для новостей без фото — снимки сайта из public (CREDITS.md). Выбор по теме, внутри темы — по slug,
// чтобы соседние новости одной рубрики не повторяли один кадр.
const covers: [RegExp, string[]][] = [
  [/гцб|государств|минфин/i, ["/hub/hub-gcb.jpg", "/carousel/city.jpg", "/hub/hub-analytics.jpg"]],
  [/эмитент|отчёт|раскрыт/i, ["/hero/issuer-signing.jpg", "/hub/hub-disclosure.jpg"]],
  [/сотрудничеств|соглашен|ислам/i, ["/carousel/meeting.jpg", "/hub/hub-members.jpg"]],
];
const defaultCovers = ["/hub/hub-news.jpg", "/carousel/trading.jpg", "/carousel/office.jpg"];

function coverFor(item: CmsNews) {
  const pool = covers.find(([pattern]) => pattern.test(`${item.tag} ${item.title}`))?.[1] ?? defaultCovers;
  const hash = [...item.slug].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  return pool[hash % pool.length];
}

/**
 * Данные для макетов 6 и 7 — те же источники и тот же состав блоков, что у главной (app/page.tsx + HomeView):
 * CMS (новости, новости компаний, срочные объявления, партнёры, контакты) и loadMarketData() (рынок).
 * Три запроса идут параллельно, один раз на страницу.
 */
export async function loadHomeData() {
  const [content, issuers, market] = await Promise.all([loadPublicContent(), loadIssuerData(), loadMarketData()]);
  const published = content.news.filter((item) => item.status === "published");
  const newest = (a: CmsNews, b: CmsNews) => dateKey(b.date).localeCompare(dateKey(a.date));
  const card = (item: CmsNews) => ({ slug: item.slug, date: item.date, tag: item.tag, title: item.title, excerpt: item.excerpt, photo: item.photo || coverFor(item) });
  const settings = content.settings;

  const instruments = [...market.instruments].sort((a, b) => b.volume - a.volume).map((item) => ({ ...item, href: instrumentHref(market, item.ticker) }));
  const movers = [{ ticker: "KSE", name: "Индекс KSE", change: market.index.change, href: "/market/index" }, ...instruments];
  const ofType = (...types: InstrumentType[]) => instruments.filter((item) => types.includes(item.type)).slice(0, 8);

  return {
    live: market.live,
    session: { ...session(), hours: market.sessionHours, date: market.sessionDate },
    index: market.index,
    history: market.indexHistory.map((row) => row.index).slice(-60),
    // Ряд индекса с датами; как в MarketPulse, значения приводятся к текущему индексу (у демо-истории другой масштаб).
    indexSeries: market.indexHistory.slice(-60).map((row) => ({
      date: row.date.replaceAll("-", "."),
      value: (row.index / (market.indexHistory.at(-1)?.index || 1)) * market.index.value,
      cap: row.cap,
    })),
    instruments,
    volume: market.stats,
    tradingRows: market.tradingRows,
    quotes: {
      stocks: ofType("stock"),
      bonds: ofType("bond", "gcb"),
      metals: ofType("metal"),
      total: instruments.length,
    },
    // Как в MarketPulse: индекс и бумаги с изменением цены. Живые данные kse.kg изменения по бумагам не публикуют.
    gainers: movers
      .filter((item) => item.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 6),
    losers: movers
      .filter((item) => item.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 6),
    leaders: market.weekLeaders.slice(0, 6),
    auctions: market.auctions.slice(0, 4),
    issuers: issuers.issuers.length,
    listed: issuers.listing.length,
    // Без анонса — черновые записи вроде тестовых: в первой полосе они смотрятся как ошибка.
    news: published
      .filter((item) => isGeneralNews(item) && item.kind !== "urgent" && item.excerpt.trim())
      .sort(newest)
      .slice(0, 5)
      .map(card),
    companyNews: published
      .filter((item) => item.kind === "company")
      .sort(newest)
      .slice(0, 4)
      .map((item) => ({ ...card(item), company: (item.issuerSlug && findIssuer(issuers, item.issuerSlug)?.name) || item.tag })),
    urgent: published
      .filter((item) => item.kind === "urgent")
      .sort(newest)
      .map((item) => ({ slug: item.slug, date: item.date, title: item.title, excerpt: item.excerpt })),
    partners: partnersOrFallback(content.partners),
    tagline: settings.tagline,
    contacts: {
      address: settings.address,
      phones: settings.phones
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      email: settings.emails.split("\n")[0]?.trim() ?? "",
      license: settings.license,
      copyright: settings.copyright || "© ЗАО «Кыргызская фондовая биржа»",
    },
  };
}

export type HomeData = Awaited<ReturnType<typeof loadHomeData>>;

/** Плавная кривая через точки ряда (Catmull-Rom → кубические Безье) для графика индекса. */
export function smoothPath(values: number[], width: number, height: number, pad = 6) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, pad + (1 - (v - min) / span) * (height - pad * 2)] as const);
  let line = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return { line, area: `${line} L${width} ${height} L0 ${height} Z`, last: pts[pts.length - 1], min, max };
}
