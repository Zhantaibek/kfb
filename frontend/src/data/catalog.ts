export type InstrumentType = "stock" | "bond" | "gcb" | "metal";

export type Instrument = {
  ticker: string;
  name: string;
  issuer: string;
  type: InstrumentType;
  price: number;
  change: number;
  volume: number;
  listing: "A" | "B" | "off";
  description: string;
};

export const sessionDate = "17.08.2026";
export const sessionHours = "09:00–17:00";
export const indexKse = { value: 8405.04, change: -0.06, capitalization: 68.5 };

export const stats = {
  volumeMln: 0.3905,
  volumeChange: 457.9,
  primary: 0,
  primaryChange: 0,
  secondary: 0.3905,
  secondaryChange: 457.9,
  listing: 0.3905,
  listingChange: 0,
  nonListing: 0,
  nonListingChange: -100,
  trades: 24,
};

export const tradingRows = [
  { label: "Объем торгов", value: stats.volumeMln, change: stats.volumeChange },
  { label: "Первичный", value: stats.primary, change: stats.primaryChange },
  { label: "Вторичный", value: stats.secondary, change: stats.secondaryChange },
  { label: "Листинг", value: stats.listing, change: stats.listingChange },
  { label: "Нелистинг", value: stats.nonListing, change: stats.nonListingChange },
] as const;

export const indexHistory = [
  { date: "28-08-2025", index: 221, cap: 41.2 },
  { date: "12-10-2025", index: 224, cap: 42.1 },
  { date: "28-11-2025", index: 219, cap: 41.6 },
  { date: "18-01-2026", index: 226, cap: 43.0 },
  { date: "09-03-2026", index: 223, cap: 42.4 },
  { date: "09-04-2026", index: 268, cap: 51.8 },
  { date: "22-05-2026", index: 291, cap: 61.4 },
  { date: "18-06-2026", index: 296, cap: 64.9 },
  { date: "20-07-2026", index: 294, cap: 66.1 },
  { date: "11-08-2026", index: 298, cap: 68.5 },
];

export const instruments: Instrument[] = [
  {
    ticker: "KTEL",
    name: "Кыргызтелеком",
    issuer: "ОАО «Кыргызтелеком»",
    type: "stock",
    price: 4,
    change: 1.3,
    volume: 178124,
    listing: "A",
    description: "Обыкновенные акции национального оператора связи. Листинг высшей категории КФБ.",
  },
  {
    ticker: "KTEL2",
    name: "Кыргызтелеком, 2-й выпуск",
    issuer: "ОАО «Кыргызтелеком»",
    type: "stock",
    price: 4,
    change: 0.4,
    volume: 11010,
    listing: "A",
    description: "Дополнительный выпуск обыкновенных акций ОАО «Кыргызтелеком».",
  },
  {
    ticker: "MAIR",
    name: "Аэропорты Кыргызстана",
    issuer: "ОАО «Международный аэропорт Манас»",
    type: "stock",
    price: 417,
    change: 0.48,
    volume: 928,
    listing: "A",
    description: "Акции оператора аэропортовой инфраструктуры Кыргызстана.",
  },
  {
    ticker: "MAIR5",
    name: "Аэропорты, 5-й выпуск",
    issuer: "ОАО «Международный аэропорт Манас»",
    type: "stock",
    price: 420,
    change: -0.2,
    volume: 2366,
    listing: "A",
    description: "Дополнительный выпуск акций аэропортового оператора.",
  },
  {
    ticker: "KAKB",
    name: "Кыргызалтын",
    issuer: "ОАО «Кыргызалтын»",
    type: "stock",
    price: 19,
    change: 2.1,
    volume: 31080,
    listing: "A",
    description: "Акции золотодобывающей компании с государственным участием.",
  },
  {
    ticker: "NESK",
    name: "НЭСК",
    issuer: "ОАО «Национальная электрическая сеть Кыргызстана»",
    type: "stock",
    price: 0.5,
    change: 0,
    volume: 137760,
    listing: "B",
    description: "Акции магистрального электросетевого оператора.",
  },
  {
    ticker: "ELST",
    name: "Электрические станции",
    issuer: "ОАО «Электрические станции»",
    type: "stock",
    price: 0.8,
    change: -0.6,
    volume: 153780,
    listing: "B",
    description: "Акции крупнейшего производителя электроэнергии в стране.",
  },
  {
    ticker: "ASUT",
    name: "Учкун",
    issuer: "ОАО «Учкун»",
    type: "stock",
    price: 1750,
    change: 0.82,
    volume: 15259,
    listing: "B",
    description: "Акции полиграфического и медиапредприятия.",
  },
  {
    ticker: "NRYN",
    name: "Нарынгидроэнергострой",
    issuer: "ОАО «Нарынгидроэнергострой»",
    type: "stock",
    price: 37000,
    change: 0.1,
    volume: 115,
    listing: "B",
    description: "Акции строительной компании гидроэнергетического комплекса.",
  },
  {
    ticker: "FCCU",
    name: "ФинансКредитБанк",
    issuer: "ОАО «ФинансКредитБанк»",
    type: "bond",
    price: 0.8,
    change: 0,
    volume: 1250000,
    listing: "A",
    description: "Корпоративные облигации банковского эмитента.",
  },
  {
    ticker: "GKV12",
    name: "ГКВ-12",
    issuer: "Министерство финансов КР",
    type: "gcb",
    price: 1000,
    change: 0.12,
    volume: 12651706,
    listing: "A",
    description: "Государственные казначейские векселя сроком обращения 12 месяцев.",
  },
  {
    ticker: "GKO2",
    name: "ГКО-2",
    issuer: "Министерство финансов КР",
    type: "gcb",
    price: 1000,
    change: 0.08,
    volume: 6322952,
    listing: "A",
    description: "Государственные казначейские облигации сроком обращения 2 года.",
  },
  {
    ticker: "GOLDB1",
    name: "Золото 1 г",
    issuer: "КФБ, сектор драгоценных металлов",
    type: "metal",
    price: 13819,
    change: 0.4,
    volume: 5,
    listing: "A",
    description: "Котировка золотого слитка номиналом 1 грамм.",
  },
  {
    ticker: "GOLDB10",
    name: "Золото 10 г",
    issuer: "КФБ, сектор драгоценных металлов",
    type: "metal",
    price: 125002.5,
    change: 0.35,
    volume: 2,
    listing: "A",
    description: "Котировка золотого слитка номиналом 10 грамм.",
  },
];

export const members = [
  { name: "ОАО «Айыл Банк»", sector: "Банк", gcb: true },
  { name: "ОАО «Элдик Банк»", sector: "Банк", gcb: true },
  { name: "ОАО «Оптима Банк»", sector: "Банк", gcb: true },
  { name: "ОАО «Бакай Банк»", sector: "Банк", gcb: true },
  { name: "ЗАО «Банк Компаньон»", sector: "Банк", gcb: true },
  { name: "ЗАО «Кыргызский инвестиционно-кредитный банк»", sector: "Банк", gcb: true },
  { name: "ОАО «Керемет Банк»", sector: "Банк", gcb: true },
  { name: "ОАО «Мбанк»", sector: "Банк", gcb: true },
  { name: "ОАО «Дос-Кредобанк»", sector: "Банк", gcb: true },
  { name: "ОсОО «Freedom Broker»", sector: "Брокер", gcb: true },
  { name: "ОсОО «BNC FINANCE»", sector: "Брокер", gcb: true },
  { name: "ОсОО «МИнвест»", sector: "Инвестиции", gcb: true },
  { name: "ОАО МФК «Салым Финанс»", sector: "МФО", gcb: true },
  { name: "ЗАО НПФ «Дордой Салым»", sector: "Пенсионный фонд", gcb: true },
  { name: "ОАО НПФ «Кыргызстан»", sector: "Пенсионный фонд", gcb: true },
  { name: "Агентство по защите депозитов КР", sector: "Госорган", gcb: true },
];

export const auctions = [
  { date: "20.08.2026", type: "ГКВ-12", volume: "500 млн сом", status: "Планируется" },
  { date: "27.08.2026", type: "ГКО-2", volume: "300 млн сом", status: "Планируется" },
  { date: "03.09.2026", type: "ГКВ-12", volume: "450 млн сом", status: "Планируется" },
  { date: "13.08.2026", type: "ГКВ-12", volume: "469,4 млн сом", status: "Состоялся" },
];

export const disclosures = [
  {
    date: "18.08.2026",
    issuer: "ОАО МФК «ИнвесКор СА»",
    title: "Начисленные доходы по облигациям",
    kind: "Существенный факт",
  },
  {
    date: "18.08.2026",
    issuer: "ОАО МФК «Салым Финанс»",
    title: "Выплаченные доходы по облигациям",
    kind: "Существенный факт",
  },
  {
    date: "14.08.2026",
    issuer: "ОАО «Тепличный»",
    title: "Изменение в составе Совета директоров",
    kind: "Корпоративное событие",
  },
  {
    date: "14.08.2026",
    issuer: "ОАО «Бишкексут»",
    title: "Изменение в составе исполнительного органа",
    kind: "Корпоративное событие",
  },
  {
    date: "12.08.2026",
    issuer: "ОАО «Кыргызтелеком»",
    title: "Ежеквартальная финансовая отчётность за 2 кв. 2026",
    kind: "Отчётность",
  },
];

export const regulations = [
  { title: "Правила биржевой торговли", group: "Биржевая деятельность" },
  { title: "Правила листинга ценных бумаг", group: "Биржевая деятельность" },
  { title: "Регламент клиринга и расчётов", group: "Биржевая деятельность" },
  { title: "Правила депозитарного учёта", group: "Депозитарная деятельность" },
  { title: "Порядок открытия счетов депо", group: "Депозитарная деятельность" },
  { title: "Положение о раскрытии информации", group: "Центр раскрытия" },
  { title: "Регламент личного кабинета эмитента", group: "Центр раскрытия" },
];

export const typeLabel: Record<InstrumentType, string> = {
  stock: "Акции",
  bond: "Облигации",
  gcb: "ГЦБ",
  metal: "Драгметаллы",
};

export function getInstrument(ticker: string) {
  return instruments.find((item) => item.ticker.toLowerCase() === ticker.toLowerCase());
}

export function formatSom(value: number) {
  return value.toLocaleString("ru-KG", { maximumFractionDigits: 2 });
}

export function formatChange(value: number) {
  if (value > 0) return `+${value.toFixed(2)}%`;
  if (value < 0) return `−${Math.abs(value).toFixed(2)}%`;
  return "0,00%";
}
