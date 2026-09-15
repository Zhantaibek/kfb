import Link from "next/link";
import type { Metadata } from "next";
import { FeedbackForm, PageIntro } from "@/components/Forms";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Товарно-сырьевой сектор" };

export default function CommodityPage() {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Товарно-сырьевой сектор
          </>
        }
        title="Товарно-сырьевой сектор КФБ"
        lead="Площадка возобновляет работу: новые сделки, контрагенты и прозрачные торги сырьём."
      />
      <div className={ui.grid}>
        <article className={ui.card}>
          <h2>Как участвовать</h2>
          <p>Зарегистрируйтесь как участник сектора, согласуйте спецификацию товара и подайте заявку на торги.</p>
        </article>
        <FeedbackForm
          title="Заявка участника сектора"
          fields={[
            { name: "company", label: "Организация", required: true },
            { name: "email", label: "E-mail", type: "email", required: true },
            { name: "goods", label: "Товар / сырьё", required: true },
          ]}
          success="Заявка принята. Департамент товарного сектора свяжется с вами в рабочей модели КФБ."
        />
      </div>
    </PublicMain>
  );
}
