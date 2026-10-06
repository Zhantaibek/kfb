"use client";

import Link from "next/link";
import { auctions, formatChange, formatSom, instruments } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import styles from "./QuoteBoard.module.css";

const quotes = instruments
  .filter((item) => item.type === "stock")
  .sort((a, b) => b.volume - a.volume)
  .slice(0, 6);

export function QuoteBoard() {
  const tr = useTr();

  return (
    <section className={styles.desk} aria-labelledby="quotes-title">
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id="quotes-title">{tr("Котировки")}</h2>
          <Link href="/market">{tr("Все инструменты")}</Link>
        </header>
        <div className={styles.columns} aria-hidden="true">
          <span>{tr("Тикер")}</span>
          <span>{tr("Бумага")}</span>
          <span>{tr("Цена")}</span>
          <span>{tr("Изменение")}</span>
          <span>{tr("Объём")}</span>
        </div>
        <div className={styles.rows}>
          {quotes.map((item) => (
            <Link href={`/market/${item.ticker}`} key={item.ticker}>
              <b>{item.ticker}</b>
              <span>{item.name}</span>
              <span>{formatSom(item.price)}</span>
              <em className={item.change < 0 ? styles.down : item.change > 0 ? styles.up : undefined}>
                {formatChange(item.change)}
              </em>
              <span>{formatSom(item.volume)}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        <header className={styles.head}>
          <h2>{tr("Аукционы ГЦБ")}</h2>
          <Link href="/gcb">{tr("Календарь")}</Link>
        </header>
        <div className={styles.auctions}>
          {auctions.map((item) => (
            <Link href="/gcb" key={`${item.date}-${item.type}`}>
              <b>{item.type}</b>
              <time>{item.date}</time>
              <span>{item.volume}</span>
              <small data-state={item.status === "Состоялся" ? "done" : "plan"}>{tr(item.status)}</small>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
