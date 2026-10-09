import type { ReactNode } from "react";
import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";
import type { Cell, Snapshot, Table } from "@/lib/kse-live";
import ui from "@/app/ui.module.css";
import css from "./live.module.css";

/** Страница с живыми данными: шапка, источник и содержимое; без данных — понятное сообщение. */
export function LivePage({
  title,
  crumb,
  lead,
  snapshot,
  sourceUrl,
  children,
}: {
  title: string;
  crumb: ReactNode;
  lead?: string;
  snapshot: Snapshot<unknown> | null;
  sourceUrl: string;
  children?: ReactNode;
}) {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / {crumb}
          </>
        }
        title={title}
        lead={lead}
      />
      {snapshot ? (
        <>
          {children}
        </>
      ) : (
        <p className={css.empty}>
          Данные ещё не загружены с kse.kg — обновление идёт раз в 15 минут. Пока можно открыть{" "}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            раздел на kse.kg
          </a>
          .
        </p>
      )}
    </PublicMain>
  );
}

function CellView({ cell }: { cell: Cell }) {
  if (!cell.href) return <>{cell.text || "—"}</>;
  return (
    <a href={cell.href} target="_blank" rel="noopener noreferrer">
      {cell.text || "Открыть"}
    </a>
  );
}

/** Таблица как на kse.kg: шапка и строки; числа — вправо. */
export function DataTable({ table, wideFirst }: { table: Table; wideFirst?: boolean }) {
  const columns = Math.max(table.head.length, ...table.rows.map((row) => row.length));
  const numeric = Array.from({ length: columns }, (_, i) =>
    table.rows.length > 0 && table.rows.every((row) => !row[i]?.text || /^[-+]?[\d\s.,%]+$/.test(row[i].text)),
  );
  return (
    <div className={ui.tableWrap}>
      <table>
        {table.head.length ? (
          <thead>
            <tr>
              {table.head.map((label, i) => (
                <th key={i} className={numeric[i] ? css.num : undefined}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) => (
                <td key={i} className={numeric[i] ? css.num : i === 0 && wideFirst ? css.wrapCell : undefined}>
                  <CellView cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "up" | "down" }) {
  return (
    <div className={css.stat}>
      <small>{label}</small>
      <b>{value}</b>
      {note ? <em className={tone === "up" ? ui.up : tone === "down" ? ui.down : undefined}>{note}</em> : null}
    </div>
  );
}
