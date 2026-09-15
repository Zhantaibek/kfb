"use client";

import Link from "next/link";
import { formatChange, formatSom, instruments } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";
import styles from "./SessionMovers.module.css";

const gainers = [...instruments].filter((item) => item.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
const losers = [...instruments].filter((item) => item.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
const mostTraded = [...instruments].sort((a, b) => b.volume - a.volume).slice(0, 5);

function MoverList({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: typeof instruments;
  kind: "up" | "down" | "vol";
}) {
  const tr = useTr();
  return (
    <article className={styles.card}>
      <h2>{title}</h2>
      <ul>
        {rows.map((item) => (
          <li key={item.ticker}>
            <Link href={`/market/${item.ticker}`}>
              <b>{item.ticker}</b>
              <small>{tr(item.name)}</small>
            </Link>
            {kind === "vol" ? (
              <span>{formatSom(item.volume)}</span>
            ) : (
              <span className={kind === "up" ? ui.up : ui.down}>{formatChange(item.change)}</span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function SessionMovers() {
  const tr = useTr();
  return (
    <section className={styles.grid} aria-label={tr("Лидеры сессии")}>
      <MoverList title={tr("Лидеры роста")} rows={gainers} kind="up" />
      <MoverList title={tr("Лидеры снижения")} rows={losers} kind="down" />
      <MoverList title={tr("По объёму")} rows={mostTraded} kind="vol" />
    </section>
  );
}
