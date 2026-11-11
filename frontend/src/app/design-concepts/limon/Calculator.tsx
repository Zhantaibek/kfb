"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Icon } from "../_shared/Icon";
import css from "./limon.module.css";

export type CalcItem = { ticker: string; name: string; price: number; href: string };

const nf = (d: number) => new Intl.NumberFormat("ru-RU", { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * «Сколько бумаг можно купить»: сумма в сомах и бумага → целое число бумаг по цене последней сессии и остаток.
 * Комиссию не выдумываем: она у каждого брокера своя, поэтому в карточке — ссылка на участников торгов.
 */
export function Calculator({ items, sessionText }: { items: CalcItem[]; sessionText: string }) {
  const id = useId();
  const [amount, setAmount] = useState("10000");
  const [ticker, setTicker] = useState(items[0]?.ticker ?? "");
  const item = items.find((i) => i.ticker === ticker) ?? items[0];
  const sum = Math.max(0, Number(amount.replace(/\s/g, "").replace(",", ".")) || 0);
  const count = item && item.price > 0 ? Math.floor(sum / item.price) : 0;
  const rest = item ? sum - count * item.price : 0;

  if (!item) return null;

  return (
    <div className={css.calc}>
      <div className={css.calcBody}>
        <div className={css.rate}>
          <Icon name="coin" />
          <span key={item.ticker} className={css.pop}>
            1 {item.ticker} = {nf(2).format(item.price)} сом
          </span>
        </div>
        <label className={css.calcLabel} htmlFor={`${id}-sum`}>
          Вы вкладываете
        </label>
        <div className={css.calcRow}>
          <span className={css.currency}>
            <i aria-hidden="true">с</i> KGS
          </span>
          <input
            id={`${id}-sum`}
            className={css.calcInput}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d\s,.]/g, ""))}
          />
        </div>
        <p className={css.calcHint}>Цена — по итогам последней торговой сессии. Комиссия брокера считается отдельно по его тарифу.</p>
        <label className={css.calcLabel} htmlFor={`${id}-t`}>
          Вы получите
        </label>
        <div className={css.calcRow}>
          <span className={css.currency}>
            <select id={`${id}-t`} value={ticker} onChange={(e) => setTicker(e.target.value)} aria-label="Бумага">
              {items.map((i) => (
                <option key={i.ticker} value={i.ticker}>
                  {i.ticker}
                </option>
              ))}
            </select>
          </span>
          <output className={css.calcOut} htmlFor={`${id}-sum ${id}-t`} aria-live="polite">
            {/* key — число «подпрыгивает» при каждом пересчёте. */}
            <span key={`${count}-${ticker}`} className={css.pop}>
              {nf(0).format(count)} шт.
            </span>
          </output>
        </div>
        <ul className={css.calcFacts}>
          <li>
            <span className={css.factIcon}>
              <Icon name="building" />
            </span>
            <span>
              <small>Эмитент</small>
              <b>{item.name}</b>
            </span>
          </li>
          <li>
            <span className={css.factIcon}>
              <Icon name="file" />
            </span>
            <span>
              <small>Останется на счёте</small>
              <b>{nf(2).format(rest)} сом</b>
            </span>
            <Link href={item.href} className={css.factLink}>
              {sessionText} ›
            </Link>
          </li>
        </ul>
        <Link href="/members" className={css.limeBtn}>
          Выбрать брокера и купить
        </Link>
      </div>
    </div>
  );
}
