// Фото новостей для концепций подбираются по теме из своего набора, а не берутся из админки: общие /carousel/*
// повторяются во всех концепциях. Соседние новости не получают одинаковое фото.
const byTopic: [RegExp, string][] = [
  [/круглый стол|сотрудничеств|инвестиц/i, "/hero/issuer-signing.jpg"],
  [/соглашени|партн[её]р|меморандум/i, "/hub/hub-members.jpg"],
  [/гцб|государствен|минфин/i, "/hub/hub-gcb.jpg"],
  [/отч[её]т|раскрыт|дивиденд|доход/i, "/hub/hub-disclosure.jpg"],
  [/торг|котиров|индекс|сесси/i, "/hub/hub-market.jpg"],
];
const spare = ["/hub/hub-news.jpg", "/hub/hub-listing.jpg", "/hero/market-charts.jpg", "/hub/hub-analytics.jpg"];

export function pickNewsPhotos(items: { tag: string; title: string }[]) {
  const used = new Set<string>();
  return items.map((item) => {
    const text = `${item.tag} ${item.title}`;
    const photo = [...byTopic.filter(([pattern]) => pattern.test(text)).map(([, src]) => src), ...spare].find((src) => !used.has(src)) ?? spare[0];
    used.add(photo);
    return photo;
  });
}
