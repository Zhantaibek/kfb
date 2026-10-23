"use client";

import Link from "next/link";
import { formatChange, formatSom, type Instrument, type InstrumentType } from "@/data/catalog";
import { useMarketData } from "@/components/MarketDataProvider";
import { instrumentHref, type MarketData } from "@/lib/market-data";
import { useTr } from "@/lib/use-tr";
import styles from "./HomeHero.module.css";

type Props = {
  index: { value: number; change: number; capitalization: number };
  volume: { value: number; change: number; trades: number };
  listing: { total: number };
};

// Карта рынка: две группы плиток, крупнее — бумаги с большим объёмом; цвет — изменение цены.
const MAP_GROUPS: { title: string; types: InstrumentType[] }[] = [
  { title: "Акции и облигации", types: ["stock", "bond"] },
  { title: "ГЦБ и драгметаллы", types: ["gcb", "metal"] },
];

/** Сколько плиток в каждом ряду: сверху крупные, ниже — мельче. */
const MAP_ROWS = [2, 3, 4];

function rowsOf(items: Instrument[]) {
  let start = 0;
  return MAP_ROWS.map((count) => items.slice(start, (start += count))).filter((row) => row.length);
}

/** Насыщенность цвета плитки — по модулю изменения, как на тепловых картах бирж. */
function levelOf(change: number) {
  const size = Math.abs(change);
  return size >= 1.5 ? 3 : size >= 0.5 ? 2 : 1;
}

function MapTile({ item, market, size }: { item: Instrument; market: MarketData; size: number }) {
  const tr = useTr();
  const tone = item.change > 0 ? "up" : item.change < 0 ? "down" : "flat";
  return (
    <Link
      className={styles.tile}
      href={instrumentHref(market, item.ticker)}
      title={item.name}
      data-tone={tone}
      data-level={levelOf(item.change)}
      data-size={size}
    >
      <b>{item.ticker}</b>
      <span>{formatSom(item.price)}</span>
      {/* kse.kg не публикует изменение цены по бумаге — в живых данных показываем вид бумаги. */}
      <em>{market.live ? tr(item.description) : formatChange(item.change)}</em>
    </Link>
  );
}

function MarketMap() {
  const tr = useTr();
  const market = useMarketData();
  const groups = MAP_GROUPS.map((group) => ({
    ...group,
    rows: rowsOf(
      market.instruments
        .filter((item) => group.types.includes(item.type) && item.price > 0)
        .sort((a, b) => b.volume - a.volume || b.price - a.price),
    ),
  })).filter((group) => group.rows.length);

  if (!groups.length) return null;
  return (
    <div className={styles.map}>
      <div className={styles.mapGroups}>
        {groups.map((group) => (
          <section className={styles.mapGroup} key={group.title} aria-label={tr(group.title)}>
            <h2>{tr(group.title)}</h2>
            {group.rows.map((row, i) => (
              <div className={styles.mapRow} key={i}>
                {row.map((item) => (
                  <MapTile key={item.ticker} item={item} market={market} size={i} />
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
      <p className={styles.mapNote}>
        {/* На живых данных плитки нейтральные: kse.kg не публикует изменение цены — говорим об этом прямо. */}
        <span>
          {market.live
            ? `${tr("Данные kse.kg")} · ${market.sessionDate} · ${tr("размер плитки — объём за неделю; изменение цены kse.kg не публикует")}`
            : tr("Демо-данные")}
        </span>
        <Link href="/market/quotes">
          {tr("Все котировки")} <Arrow />
        </Link>
      </p>
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function HomeHero({ index, volume, listing }: Props) {
  const tr = useTr();
  const tone = (value: number) => (value < 0 ? styles.down : value > 0 ? styles.up : undefined);
  const figure = index.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <section className={styles.hero} aria-label={tr("Главный баннер")}>
      <div className={styles.photo} aria-hidden="true" />

      <div className={styles.main}>
        <div className={styles.copy}>
          <h1>{tr("Инвестиции в стабильное будущее")}</h1>
          <p>
            {tr(
              "Кыргызская фондовая биржа — это прозрачный и надежный механизм для привлечения капитала, развития бизнеса и роста экономики страны.",
            )}
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/market">
              {tr("Торговать")}
              <Arrow />
            </Link>
            <Link className={styles.link} href="/about">
              {tr("Подробнее")}
              <Arrow />
            </Link>
          </div>
        </div>
        <MarketMap />
      </div>

      <div className={styles.stats}>
        <Link className={styles.stat} href="/market/index">
          <span className={styles.label}>{tr("Индекс KSE")}</span>
          <span className={styles.value}>
            <b>{figure}</b>
            <em className={tone(index.change)}>{formatChange(index.change)}</em>
          </span>
        </Link>
        <Link className={styles.stat} href="/market/index">
          <span className={styles.label}>{tr("Капитализация")}</span>
          <span className={styles.value}>
            <b>{formatSom(index.capitalization)}</b>
            <small>{tr("млрд сом")}</small>
          </span>
        </Link>
        <Link className={styles.stat} href="/market">
          <span className={styles.label}>{tr("Объём торгов")}</span>
          <span className={styles.value}>
            <b>{formatSom(volume.value)}</b>
            <small>{tr("млн сом")}</small>
            <em className={tone(volume.change)}>{formatChange(volume.change)}</em>
          </span>
        </Link>
        <Link className={styles.stat} href="/market/quotes">
          <span className={styles.label}>{tr("Инструменты")}</span>
          <span className={styles.value}>
            <b>{listing.total}</b>
            <small>
              {volume.trades} {tr("сделок")}
            </small>
          </span>
        </Link>
      </div>
    </section>
  );
}
