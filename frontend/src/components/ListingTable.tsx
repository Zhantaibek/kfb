"use client";

import Link from "next/link";
import { Fragment } from "react";
import { listingCategories, type ListingRow } from "@/data/listing";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";
import css from "@/app/listing/listing.module.css";

function Issuer({ row }: { row: ListingRow }) {
  return (
    <>
      {row.slug ? (
        <Link href={`/disclosure/${row.slug}`}>{row.name}</Link>
      ) : (
        <span className={css.plain}>{row.name}</span>
      )}
      <span className={css.code}>{row.code}</span>
    </>
  );
}

export function ListingTable() {
  const tr = useTr();
  const dash = "—";

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
          {listingCategories.map((category) => (
            <Fragment key={category.title}>
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
