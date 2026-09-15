"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { members } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export default function MembersPage() {
  const tr = useTr();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("Все");
  const sectors = ["Все", ...Array.from(new Set(members.map((item) => item.sector)))];
  const rows = useMemo(
    () =>
      members.filter((item) => {
        const match = sector === "Все" || item.sector === sector;
        const q = query.trim().toLowerCase();
        return match && (!q || item.name.toLowerCase().includes(q));
      }),
    [query, sector],
  );

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Участники
          </>
        }
        title="Участники торгов"
        lead="Банки, брокеры, пенсионные и страховые организации с доступом к сектору ГЦБ и фондовому рынку КФБ."
      />
      <div className={ui.toolbar}>
        <Link href="/members/stdm">{tr("Участники СТДМ")}</Link>
        <Link href="/members/commodity">{tr("Товарно-сырьевой сектор")}</Link>
        <Link href="/members/gcb">{tr("Участники ГЦБ")}</Link>
      </div>
      <div className={ui.toolbar}>
        <input className={ui.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tr("Название организации")} />
        <div className={ui.pills}>
          {sectors.map((item) => (
            <button key={item} type="button" data-on={String(sector === item)} onClick={() => setSector(item)}>
              {tr(item)}
            </button>
          ))}
        </div>
      </div>
      <div className={ui.list}>
        {rows.map((item) => (
          <article className={ui.row} key={item.name}>
            <h3>{item.name}</h3>
            <small>
              {tr(item.sector)}
              {item.gcb ? ` · ${tr("сектор ГЦБ")}` : ""}
            </small>
          </article>
        ))}
      </div>
    </PublicMain>
  );
}
