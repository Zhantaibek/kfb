import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { regulations } from "@/data/catalog";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Нормативная база" };

export default function DocumentsPage() {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Документы
          </>
        }
        title="Нормативная база"
        lead="Правила биржевой и депозитарной деятельности, листинг и раскрытие информации."
      />
      <div className={ui.list}>
        {regulations.map((item) => (
          <article className={ui.row} key={item.title}>
            <small>{item.group}</small>
            <h3>{item.title}</h3>
            <p>Документ доступен в демо-режиме. На боевом сайте КФБ файлы публикуются в PDF.</p>
          </article>
        ))}
      </div>
    </PublicMain>
  );
}
