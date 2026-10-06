"use client";

import Link from "next/link";
import { Fragment } from "react";
import { listingCategoryIds, listingCategoryTitles, type CmsListingEntry } from "@/lib/cms/types";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";
import css from "@/app/listing/listing.module.css";

export type ListingTableRow = Pick<
  CmsListingEntry,
  "id" | "code" | "category" | "order" | "name" | "issuerSlug" | "security" | "price" | "cap" | "count" | "doc"
>;

function Issuer({ row }: { row: ListingTableRow }) {
  return (
    <>
      {row.issuerSlug ? (
        <Link href={`/disclosure/${row.issuerSlug}`}>{row.name}</Link>
      ) : (
        <span className={css.plain}>{row.name}</span>
      )}
      <span className={css.code}>{row.code}</span>
    </>
  );
}

/** issuerSlug в строках уже очищен у эмитентов, которых нет в Центре раскрытия, — см. app/listing/page.tsx. */
export function ListingTable({ entries }: { entries: ListingTableRow[] }) {
  const tr = useTr();
  const dash = "—";
  const categories = listingCategoryIds
    .map((id) => ({
      id,
      title: listingCategoryTitles[id],
      rows: entries.filter((row) => row.category === id).sort((a, b) => a.order - b.order),
    }))
    .filter((category) => category.rows.length);

  return (
    <div className={`${ui.tableWrap} ${css.table}`}>
      <table>
        <thead>
          <tr>
            <th>{tr("Эмитент")}</th>
            <th>{tr("Ценная бумага")}</th>
            <th>{tr("Цена последней сделки, сом")}</th>
            <th>{tr("Капитализация млн, сом")}</th>
            <th>{tr("Кол-во ЦБ")}</th>
            <th>{tr("Анкета")}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <Fragment key={category.id}>
              <tr className={css.category}>
                <td colSpan={6}>{tr(category.title)}</td>
              </tr>
              {category.rows.map((row) => (
                <tr key={row.code}>
                  <td>
                    <Issuer row={row} />
                  </td>
                  <td>{tr(row.security) || dash}</td>
                  <td>{row.price || dash}</td>
                  <td>{row.cap || dash}</td>
                  <td>{row.count || dash}</td>
                  <td>
                    {row.doc ? (
                      <a className={css.doc} href={row.doc} target="_blank" rel="noreferrer" title={tr("Анкета эмитента")}>
                        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M14 3v5h5" strokeLinejoin="round" />
                          <path d="M6 3h8l5 5v13H6z" strokeLinejoin="round" />
                          <path d="M9 13h6M9 17h4" strokeLinecap="round" />
                        </svg>
                      </a>
                    ) : (
                      <span className={css.empty}>{dash}</span>
                    )}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
