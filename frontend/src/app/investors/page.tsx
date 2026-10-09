import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Инвесторам" };

export default function InvestorsPage() {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Инвесторам
          </>
        }
        title="Как начать инвестировать"
        lead="Частному инвестору нужен счёт у участника торгов. Дальше — выбор акций, облигаций, ГЦБ или драгоценных металлов."
      />
      <div className={ui.grid}>
        <Link className={ui.card} href="/members">
          <small>01</small>
          <h3>Выбрать брокера</h3>
          <p>Банки и инвестиционные компании — участники торгов КФБ.</p>
        </Link>
        <Link className={ui.card} href="/market">
          <small>02</small>
          <h3>Смотреть котировки</h3>
          <p>Цены, объёмы и карточки инструментов обновляются по итогам сессии.</p>
        </Link>
        <Link className={ui.card} href="/gcb">
          <small>03</small>
          <h3>Инвестиции в ГЦБ</h3>
          <p>Казначейские векселя и облигации Минфина КР.</p>
        </Link>
      </div>
    </PublicMain>
  );
}
