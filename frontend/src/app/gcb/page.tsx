import Link from "next/link";
import type { Metadata } from "next";
import { FeedbackForm, PageIntro } from "@/components/Forms";
import { DataTable, LiveSource } from "@/components/live/LiveParts";
import { MarketLinks } from "@/components/live/LiveViews";
import { loadSnapshot, type TablesPage } from "@/lib/kse-live";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Государственные ценные бумаги" };

export default async function GcbPage() {
  // Расписание аукционов — живые данные с kse.kg/ru/ScheduleGS.
  const schedule = await loadSnapshot<TablesPage>("auction-schedule");
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / ГЦБ
          </>
        }
        title="Инвестируйте в ГЦБ"
        lead="Государственные казначейские векселя ГКВ-12 и облигации ГКО-2 выпускает Министерство финансов КР. Один из самых надёжных инструментов на рынке Кыргызстана."
      />
      <section style={{ marginBottom: 22 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 22 }}>{schedule?.data.title || "Расписание аукционов по ГЦБ"}</h2>
        {schedule ? (
          <>
            <LiveSource snapshot={schedule} />
            {schedule.data.tables.map((table, i) => (
              <DataTable key={i} table={table} />
            ))}
          </>
        ) : (
          <p className={ui.muted}>
            Расписание загружается с kse.kg.{" "}
            <a href="https://www.kse.kg/ru/ScheduleGS" target="_blank" rel="noopener noreferrer">
              Открыть на kse.kg
            </a>
          </p>
        )}
      </section>
      <div className={ui.grid}>
        <article className={ui.card}>
          <h2>Как купить</h2>
          <ul>
            <li>Откройте счёт у участника торгов в секторе ГЦБ</li>
            <li>Выберите аукцион Минфина или вторичные торги</li>
            <li>Поручение исполняет брокер или банк-участник</li>
          </ul>
          <Link className={ui.primary} href="/members" style={{ marginTop: 16, display: "inline-flex" }}>
            Список участников
          </Link>
        </article>
        <FeedbackForm
          title="Напомнить о ближайшем аукционе"
          fields={[
            { name: "email", label: "E-mail", type: "email", required: true },
            { name: "type", label: "Инструмент (ГКВ-12 / ГКО-2)", required: true },
          ]}
          success="Заявка принята. Это демо: письмо не отправляется, аукционы смотрите в таблице."
        />
      </div>
      <MarketLinks current="/gcb" />
    </PublicMain>
  );
}
