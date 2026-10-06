import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { EDU_PLATFORM_URL } from "@/lib/edu";
import { CmsPageView } from "@/components/CmsPageView";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "План работы на год" };

const courses = [
  { name: 'Тренинг «Стратегическое управление»', q1: 1, q2: 0, q3: 0, q4: 0, total: 1 },
  { name: 'Тренинг «Исламские финансы» (Сукук)', q1: 2, q2: 0, q3: 0, q4: 0, total: 2 },
  { name: 'Курс «Организация и функционирование рынка ценных бумаг»', q1: 1, q2: 2, q3: 1, q4: 2, total: 6 },
  { name: 'Тренинг «ESG — технологии»', q1: 0, q2: 1, q3: 0, q4: 0, total: 1 },
  { name: 'Тренинг «Личная эффективность и Soft Skills»', q1: 0, q2: 1, q3: 0, q4: 0, total: 1 },
  { name: 'Тренинг «Эффективные коммуникации и PR»', q1: 0, q2: 1, q3: 0, q4: 0, total: 1 },
];

export default async function EducationPlanPage() {
  const content = await loadPublicContent();
  // Если план заведён в админке (перенесён с kse.kg), показываем его вместо встроенной таблицы.
  const page = findPageByPath(content, "/education/plan");
  if (page) return <CmsPageView page={page} />;
  const { settings } = content;
  const eduUrl = settings.eduUrl || EDU_PLATFORM_URL;

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / <Link href="/education">Учебный центр</Link> / План работы на год
          </>
        }
        title="План курсов Учебного центра на 2026 год"
        lead="Расписание тренингов и курсов ЗАО «Кыргызская фондовая биржа». Запись и обучение — в онлайн-платформе."
      />

      <article className={ui.card}>
        <div className={ui.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Наименование курсов</th>
                <th>1 квартал</th>
                <th>2 квартал</th>
                <th>3 квартал</th>
                <th>4 квартал</th>
                <th>Итого 2026</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((item, index) => (
                <tr key={item.name}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.q1}</td>
                  <td>{item.q2}</td>
                  <td>{item.q3}</td>
                  <td>{item.q4}</td>
                  <td>
                    <b>{item.total}</b>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={2}>
                  <b>Итого</b>
                </td>
                <td>
                  <b>3</b>
                </td>
                <td>
                  <b>5</b>
                </td>
                <td>
                  <b>1</b>
                </td>
                <td>
                  <b>2</b>
                </td>
                <td>
                  <b>11</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 16 }}>
          Учебный центр осуществляет постоянный набор на курс «Организация и функционирование рынка ценных бумаг». Даты
          проведения могут корректироваться в зависимости от количества зарегистрированных участников.
        </p>
        <p>
          <a className={ui.primary} href={eduUrl} target="_blank" rel="noopener noreferrer">
            Открыть учебную платформу →
          </a>
        </p>
        <p>
          Контакты: Учебный центр {settings.eduPhone || "+996 (772) 63-79-97"} · Приёмная {settings.phones.split("\n")[0] || "+996 (312) 31-14-84"}
        </p>
        <p>
          <Link href="/education">← Общая информация</Link>
        </p>
      </article>
    </PublicMain>
  );
}
