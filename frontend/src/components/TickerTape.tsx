"use client";

import Link from "next/link";
import { instruments } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";

const tapeItems = instruments
  .slice(0, 10)
  .map((item) => ({
    ticker: item.ticker,
    price: item.price.toLocaleString("ru-KG", { maximumFractionDigits: 2 }),
    volume: item.volume.toLocaleString("ru-KG", { maximumFractionDigits: 0 }),
  }));

function TapeRow() {
  return (
    <>
      {tapeItems.map((item, index) => (
        <Link className={ui.tickerItem} href={`/market/${item.ticker}`} key={`${item.ticker}-${index}`}>
          <span>{item.ticker}</span>
          <b>{item.price}</b>
          <small>{item.volume}</small>
        </Link>
      ))}
    </>
  );
}

export function TickerTape() {
  const tr = useTr();
  return (
    <div className={ui.tickerBar} aria-label={tr("Биржевая лента")}>
      <div className={ui.tickerTrack}>
        <div className={ui.tickerLane}>
          <TapeRow />
        </div>
        <div className={ui.tickerLane} aria-hidden="true">
          <TapeRow />
        </div>
      </div>
    </div>
  );
}
