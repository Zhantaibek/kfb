"use client";

import Link from "next/link";
import { formatChange, formatSom } from "@/data/catalog";
import { useMarketData } from "@/components/MarketDataProvider";
import { instrumentHref } from "@/lib/market-data";
import { useTr } from "@/lib/use-tr";
import styles from "./QuoteBoard.module.css";

export function QuoteBoard() {
  const tr = useTr();
  const market = useMarketData();
  // Акции с наибольшим объёмом (в живых данных — сделки за неделю), затем самые дорогие.
  const quotes = market.instruments
    .filter((item) => item.type === "stock" && item.price > 0)
    .sort((a, b) => b.volume - a.volume || b.price - a.price)
    .slice(0, 6);

  return (
    <section className={styles.desk} aria-labelledby="quotes-title">
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id="quotes-title">{tr("Котировки")}</h2>
          <Link href="/market/quotes">{tr("Все инструменты")}</Link>
        </header>
        <div className={styles.columns} aria-hidden="true">
          <span>{tr("Тикер")}</span>
          <span>{tr("Бумага")}</span>
          <span>{tr("Цена")}</span>
          {/* kse.kg не публикует изменение цены по бумаге — в живых данных показываем вид бумаги. */}
          <span>{market.live ? tr("Вид") : tr("Изменение")}</span>
          <span>{market.live ? tr("Объём, тыс.") : tr("Объём")}</span>
        </div>
        <div className={styles.rows}>
          {quotes.map((item) => (
            <Link href={instrumentHref(market, item.ticker)} key={item.ticker}>
              <b>{item.ticker}</b>
              <span>{item.name}</span>
              <span>{formatSom(item.price)}</span>
              {market.live ? (
                <span>{tr(item.description)}</span>
              ) : (
                <em className={item.change < 0 ? styles.down : item.change > 0 ? styles.up : undefined}>
                  {formatChange(item.change)}
                </em>
              )}
              <span>{item.volume ? formatSom(item.volume) : "—"}</span>
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
          {market.auctions.map((item) => (
            <Link href="/gcb" key={`${item.date}-${item.type}`}>
              <b>{item.type}</b>
              <time>{item.date}</time>
              <span>{item.volume}</span>
              <small data-state={item.status === "Состоялся" ? "done" : "plan"}>{tr(item.status)}</small>
            </Link>
          ))}
          {!market.auctions.length ? <p>{tr("Ближайших аукционов нет")}</p> : null}
        </div>
      </div>
    </section>
  );
}
