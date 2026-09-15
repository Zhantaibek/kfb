import Link from "next/link";
import type { Metadata } from "next";
import { FeedbackForm, PageIntro } from "@/components/Forms";
import { auctions } from "@/data/catalog";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Государственные ценные бумаги" };

export default function GcbPage() {
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
      <div className={ui.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Объём</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((row) => (
              <tr key={`${row.date}-${row.type}`}>
                <td>{row.date}</td>
                <td>{row.type}</td>
                <td>{row.volume}</td>
                      <td data-status={row.status === "Состоялся" ? "done" : "soon"}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    </PublicMain>
  );
}
