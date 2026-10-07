"use client";

import Link from "next/link";
import { useMarketData } from "@/components/MarketDataProvider";
import { instrumentHref } from "@/lib/market-data";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";

type TapeItem = { ticker: string; price: string; volume: string; href: string };

function TapeRow({ items }: { items: TapeItem[] }) {
  // Лента повторяется трижды, чтобы бесшовно прокручиваться на широких экранах.
  const lane = [...items, ...items, ...items];
  return (
    <>
      {lane.map((item, index) => (
        <Link className={ui.tickerItem} href={item.href} key={`${item.ticker}-${index}`}>
          <span>{item.ticker}</span>
          <b>{item.price}</b>
          {item.volume ? <small>{item.volume}</small> : null}
        </Link>
      ))}
    </>
  );
}

/** Бегущая строка котировок — живые данные kse.kg (цена последней сделки или лучшей заявки). */
export function TickerTape() {
  const tr = useTr();
  const market = useMarketData();
  const items = market.instruments.slice(0, 16).map((item) => ({
    ticker: item.ticker,
    price: item.price.toLocaleString("ru-KG", { maximumFractionDigits: 2 }),
    volume: item.volume ? item.volume.toLocaleString("ru-KG", { maximumFractionDigits: 0 }) : "",
    href: instrumentHref(market, item.ticker),
  }));
  if (!items.length) return null;
  return (
    <div className={ui.tickerBar} aria-label={tr("Биржевая лента")}>
      <div className={ui.tickerTrack}>
        <div className={ui.tickerLane}>
          <TapeRow items={items} />
        </div>
        <div className={ui.tickerLane} aria-hidden="true">
          <TapeRow items={items} />
        </div>
      </div>
    </div>
  );
}
