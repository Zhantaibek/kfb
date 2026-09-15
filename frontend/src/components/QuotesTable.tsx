"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatChange, formatSom, instruments, type InstrumentType, typeLabel } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";

const filters: { id: "all" | InstrumentType; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "stock", label: "Акции" },
  { id: "bond", label: "Облигации" },
  { id: "gcb", label: "ГЦБ" },
  { id: "metal", label: "Драгметаллы" },
];

export function QuotesTable({ compact = false }: { compact?: boolean }) {
  const tr = useTr();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof filters)[number]["id"]>("all");
  const [sort, setSort] = useState<"ticker" | "change" | "volume">("ticker");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return instruments
      .filter((item) => (type === "all" ? true : item.type === type))
      .filter((item) => !q || `${item.ticker} ${item.name} ${item.issuer}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "change") return b.change - a.change;
        if (sort === "volume") return b.volume - a.volume;
        return a.ticker.localeCompare(b.ticker);
      });
  }, [query, type, sort]);

  return (
    <div>
      <div className={ui.toolbar}>
        <input className={ui.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Тикер или эмитент")} />
        <div className={ui.pills}>
          {filters.map((item) => (
            <button key={item.id} type="button" data-on={String(type === item.id)} onClick={() => setType(item.id)}>
              {tr(item.label)}
            </button>
          ))}
        </div>
        <select className={ui.select} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="ticker">{tr("По тикеру")}</option>
          <option value="change">{tr("По изменению")}</option>
          <option value="volume">{tr("По объёму")}</option>
        </select>
      </div>
      <div className={ui.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>{tr("Тикер")}</th>
              <th>{tr("Инструмент")}</th>
              {!compact ? <th>{tr("Тип")}</th> : null}
              <th>{tr("Цена, сом")}</th>
              <th>{tr("Изм.")}</th>
              <th>{tr("Объём")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker}>
                <td>
                  <Link href={`/market/${row.ticker}`}>{row.ticker}</Link>
                </td>
                <td>{tr(row.name)}</td>
                {!compact ? <td>{tr(typeLabel[row.type])}</td> : null}
                <td>{formatSom(row.price)}</td>
                <td className={row.change < 0 ? ui.down : row.change > 0 ? ui.up : undefined}>{formatChange(row.change)}</td>
                <td>{formatSom(row.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
