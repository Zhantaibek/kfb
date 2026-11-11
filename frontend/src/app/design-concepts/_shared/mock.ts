/**
 * Демонстрационные данные для макетов 1, 2 и 4: чтобы оценить страницу «как живой сайт».
 * Цифры, даты, события и тексты новостей вымышлены; тикеры и названия эмитентов — из списка КФБ.
 * На каждой странице макета есть пометка «демо-данные».
 */

export type Quote = {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  volume: number;
  deals: number;
};

export const quotes: Quote[] = [
  {
    ticker: "MAIR9",
    name: "Аэропорты Кыргызстана",
    sector: "Транспорт",
    price: 415.73,
    change: 2.84,
    volume: 1265.2,
    deals: 12,
  },
  {
    ticker: "KAVB8",
    name: "Кыргызкоммерцбанк",
    sector: "Банки",
    price: 500.0,
    change: 1.21,
    volume: 1020.0,
    deals: 7,
  },
  {
    ticker: "KNEF3",
    name: "Кыргызнефтегаз",
    sector: "Энергетика",
    price: 263.96,
    change: -0.74,
    volume: 828.3,
    deals: 9,
  },
  {
    ticker: "MAIR5",
    name: "Аэропорты Кыргызстана",
    sector: "Транспорт",
    price: 409.0,
    change: 0.37,
    volume: 864.2,
    deals: 5,
  },
  {
    ticker: "KTEL3",
    name: "Кыргызтелеком",
    sector: "Связь",
    price: 4.12,
    change: -1.9,
    volume: 312.6,
    deals: 11,
  },
  {
    ticker: "KAKB25",
    name: "Мбанк",
    sector: "Банки",
    price: 17.5,
    change: 3.55,
    volume: 273.3,
    deals: 6,
  },
  {
    ticker: "ELST7",
    name: "Электрические станции",
    sector: "Энергетика",
    price: 0.9,
    change: -2.17,
    volume: 198.4,
    deals: 4,
  },
  {
    ticker: "BMZD",
    name: "Бишкекский машзавод",
    sector: "Промышленность",
    price: 80.0,
    change: 0.0,
    volume: 96.0,
    deals: 2,
  },
  {
    ticker: "NESK2",
    name: "Северэлектро",
    sector: "Энергетика",
    price: 0.5,
    change: 4.17,
    volume: 64.8,
    deals: 3,
  },
  {
    ticker: "MAIR3",
    name: "Аэропорты Кыргызстана",
    sector: "Транспорт",
    price: 380.0,
    change: -0.52,
    volume: 275.5,
    deals: 6,
  },
];

export const gainers = [...quotes].sort((a, b) => b.change - a.change).slice(0, 4);
export const losers = [...quotes].sort((a, b) => a.change - b.change).slice(0, 4);

/** Индекс KSE: 90 торговых дней с плавным ростом и шумом — детерминированно, чтобы картинка не прыгала. */
export const indexSeries = Array.from({ length: 90 }, (_, i) => {
  const trend = 7820 + i * 6.6;
  const wave = Math.sin(i / 6) * 48 + Math.sin(i / 2.3) * 17;
  return Math.round((trend + wave) * 100) / 100;
});

export const market = {
  index: indexSeries.at(-1)!,
  indexChange: 0.86,
  capitalization: 293.4,
  volume: 5.19,
  volumeChange: 18.4,
  deals: 65,
  issuers: 194,
  listed: 38,
  sessionDate: "27 октября 2026",
};

export const sectors = [
  { name: "Банки", share: 34 },
  { name: "Энергетика", share: 27 },
  { name: "Транспорт", share: 21 },
  { name: "Связь", share: 9 },
  { name: "Прочее", share: 9 },
];

export const news = [
  {
    slug: "demo-1",
    tag: "Торги",
    date: "27 октября 2026",
    title: "Объём торгов за октябрь превысил показатель сентября на 18%",
    excerpt: "Наибольшую активность показали акции транспортного и банковского секторов, число сделок выросло до 65 за сессию.",
    photo: "/hero/market-charts.jpg",
  },
  {
    slug: "demo-2",
    tag: "Листинг",
    date: "24 октября 2026",
    title: "В официальный список включены облигации микрофинансовой компании",
    excerpt: "Бумаги прошли процедуру листинга по категории «Б»; торги начнутся со следующей недели.",
    photo: "/hero/issuer-signing.jpg",
  },
  {
    slug: "demo-3",
    tag: "ГЦБ",
    date: "22 октября 2026",
    title: "Минфин разместил ГКВ-12 на 500 млн сом",
    excerpt: "Средневзвешенная доходность составила 12,4% годовых, спрос превысил предложение в 1,6 раза.",
    photo: "/hub/hub-gcb.jpg",
  },
  {
    slug: "demo-4",
    tag: "Сотрудничество",
    date: "20 октября 2026",
    title: "Биржа и регулятор провели круглый стол по институциональным инвестициям",
    excerpt: "Обсудили пенсионные накопления, страховые резервы и роль биржевой инфраструктуры.",
    photo: "/carousel/meeting.jpg",
  },
  {
    slug: "demo-5",
    tag: "Обучение",
    date: "17 октября 2026",
    title: "Открыт набор на курс «Основы инвестирования» в учебном центре",
    excerpt: "Шесть занятий для начинающих инвесторов: как выбрать брокера, читать котировки и отчётность.",
    photo: "/hub/hub-education.jpg",
  },
  {
    slug: "demo-6",
    tag: "Драгметаллы",
    date: "15 октября 2026",
    title: "Торги мерными слитками: итоги третьего квартала",
    excerpt: "Спрос на золотые слитки весом 10 и 20 граммов вырос, средняя цена сделки — 6 940 сом за грамм.",
    photo: "/carousel/gold.jpg",
  },
];

export const events = [
  {
    day: "29",
    month: "окт",
    title: "Аукцион ГКВ-12",
    place: "Сектор ГЦБ",
    time: "10:00",
  },
  {
    day: "31",
    month: "окт",
    title: "Годовое собрание акционеров ОАО «Кыргызтелеком»",
    place: "Раскрытие информации",
    time: "14:00",
  },
  {
    day: "04",
    month: "ноя",
    title: "Семинар «Как читать отчётность эмитента»",
    place: "Учебный центр",
    time: "15:00",
  },
  {
    day: "06",
    month: "ноя",
    title: "Аукцион ГКО-2",
    place: "Сектор ГЦБ",
    time: "10:00",
  },
];

export const disclosures = [
  {
    company: "ОАО «Кыргызтелеком»",
    type: "Существенный факт",
    title: "Решение совета директоров о выплате дивидендов",
    date: "27.10.2026",
  },
  {
    company: "ОАО «Аэропорты Кыргызстана»",
    type: "Квартальный отчёт",
    title: "Финансовая отчётность за III квартал 2026 года",
    date: "26.10.2026",
  },
  {
    company: "ОАО «Мбанк»",
    type: "Существенный факт",
    title: "Изменение состава правления",
    date: "25.10.2026",
  },
  {
    company: "ОАО «Кыргызнефтегаз»",
    type: "Годовой отчёт",
    title: "Аудиторское заключение за 2025 год",
    date: "23.10.2026",
  },
  {
    company: "ОАО «Северэлектро»",
    type: "Существенный факт",
    title: "Сделка с заинтересованностью",
    date: "22.10.2026",
  },
];

export const documents = [
  { title: "Правила биржевой торговли", meta: "PDF · 1,2 МБ" },
  { title: "Правила листинга ценных бумаг", meta: "PDF · 860 КБ" },
  { title: "Тарифы биржи на 2026 год", meta: "PDF · 240 КБ" },
  { title: "Ежемесячный обзор рынка, сентябрь 2026", meta: "PDF · 3,4 МБ" },
];

export const audiences = [
  {
    title: "Инвесторам",
    text: "Как открыть счёт у брокера, какие бумаги торгуются и сколько это стоит.",
    href: "/investors",
    photo: "/hub/hub-analytics.jpg",
  },
  {
    title: "Эмитентам",
    text: "Листинг, размещение облигаций и требования к раскрытию информации.",
    href: "/listing",
    photo: "/hub/hub-listing.jpg",
  },
  {
    title: "Участникам торгов",
    text: "Подключение к торговой системе, регламенты и рейтинг участников.",
    href: "/members",
    photo: "/hub/hub-members.jpg",
  },
];

export const keyFacts = [
  { value: "1994", label: "год основания биржи" },
  { value: "194", label: "эмитента в центре раскрытия" },
  { value: "38", label: "бумаг в официальном списке" },
  { value: "22", label: "участника торгов" },
];

/** Короткий ряд для мини-графика бумаги (детерминированный по тикеру). */
export function miniSeries(ticker: string, change: number) {
  const seed = [...ticker].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return Array.from({ length: 20 }, (_, i) => 100 + Math.sin((i + seed) / 2.2) * 2 + (change * i) / 10);
}
