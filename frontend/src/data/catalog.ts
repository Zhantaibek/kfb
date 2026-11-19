/**
 * Типы и форматирование бумаг для блоков рынка. Сами данные — только живые (снимки kse.kg и наша база,
 * см. lib/market-data.ts); демо-каталога с выдуманными ценами больше нет.
 */

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

/** Время торговой сессии КФБ. */
export const sessionHours = "09:00–17:00";

export const typeLabel: Record<InstrumentType, string> = {
  stock: "Акции",
  bond: "Облигации",
  gcb: "ГЦБ",
  metal: "Драгметаллы",
};

export function formatSom(value: number) {
  return value.toLocaleString("ru-KG", { maximumFractionDigits: 2 });
}

/** Объём торгов в млн сом — как в источнике, до 4 знаков (0,0676, а не 0,07: малые объёмы не теряются при округлении). */
export function formatVolume(value: number) {
  return value.toLocaleString("ru-KG", { maximumFractionDigits: 4 });
}

export function formatChange(value: number) {
  if (value > 0) return `+${value.toFixed(2)}%`;
  if (value < 0) return `−${Math.abs(value).toFixed(2)}%`;
  return "0,00%";
}
