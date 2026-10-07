import Link from "next/link";
import type { Metadata } from "next";
import { FeedbackForm, PageIntro } from "@/components/Forms";
import { CmsSection } from "@/components/CmsSection";
import { EDU_PLATFORM_URL, eduLinkProps } from "@/lib/edu";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";
import { splitLines, telHref } from "@/lib/cms/contacts";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Учебный центр" };

const courses = [
  { name: 'Тренинг «Стратегическое управление»', q1: 1, q2: 0, q3: 0, q4: 0, total: 1 },
  { name: 'Тренинг «Исламские финансы» (Сукук)', q1: 2, q2: 0, q3: 0, q4: 0, total: 2 },
  { name: 'Курс «Организация и функционирование рынка ценных бумаг»', q1: 1, q2: 2, q3: 1, q4: 2, total: 6 },
  { name: 'Тренинг «ESG — технологии»', q1: 0, q2: 1, q3: 0, q4: 0, total: 1 },
  { name: 'Тренинг «Личная эффективность и Soft Skills»', q1: 0, q2: 1, q3: 0, q4: 0, total: 1 },
  { name: 'Тренинг «Эффективные коммуникации и PR»', q1: 0, q2: 1, q3: 0, q4: 0, total: 1 },
];

export default async function EducationPage() {
  const content = await loadPublicContent();
  const { settings } = content;
  // История и задачи Учебного центра — страница /education в админке (перенесена с kse.kg).
  const about = findPageByPath(content, "/education");
  const eduUrl = settings.eduUrl || EDU_PLATFORM_URL;
  const phones = splitLines(settings.phones);

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Учебный центр / Общая информация
          </>
        }
        title="Учебный центр КФБ"
        lead="С сентября 1995 года Учебный центр готовит специалистов рынка ценных бумаг: курсы, семинары и кабинет обучения онлайн."
      />

      <div className={ui.grid}>
        <article className={ui.card}>
          <h2>Онлайн-платформа обучения</h2>
          <p>
            Курсы, уроки, задания, прогресс и кабинет студента / преподавателя / администратора — в учебной CRM КФБ.
          </p>
          <p style={{ marginTop: 28 }}>
            <a className={ui.primary} href={eduUrl} {...eduLinkProps(eduUrl)}>
              Открыть учебную платформу →
            </a>
          </p>
          <p style={{ marginTop: 48 }}>
            <Link href="/education/plan">План работы на год →</Link>
          </p>
        </article>

        <article className={ui.card}>
          <h2>О центре</h2>
          <p>
            В сентябре 1995 года создан Учебный центр по подготовке специалистов в сфере рынка ценных бумаг при
            Кыргызской фондовой бирже. Цель — современный центр обучения, соответствующий международным стандартам.
          </p>
          <p>
            Постоянный набор на курс «Организация и функционирование рынка ценных бумаг». Даты могут корректироваться в
            зависимости от числа участников.
          </p>
          <ul>
            {settings.eduPhone ? <li>Учебный центр: {settings.eduPhone}</li> : null}
            {phones[0] ? (
              <li>
                Приёмная КФБ: <a href={telHref(phones[0])}>{phones[0]}</a>
              </li>
            ) : null}
            {phones[1] ? (
              <li>
                WhatsApp: <a href={telHref(phones[1])}>{phones[1]}</a>
              </li>
            ) : null}
          </ul>
        </article>
      </div>

      <section className={ui.card} style={{ marginTop: 20 }}>
        <h2>План курсов на 2026 год</h2>
        <div className={ui.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Наименование</th>
                <th>1 кв.</th>
                <th>2 кв.</th>
                <th>3 кв.</th>
                <th>4 кв.</th>
                <th>Итого</th>
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
      </section>

      <CmsSection page={about} title="Об Учебном центре" />

      <div className={ui.grid} style={{ marginTop: 20 }}>
        <FeedbackForm
          title="Запись на семинар"
          fields={[
            { name: "name", label: "Имя", required: true },
            { name: "email", label: "E-mail", type: "email", required: true },
            { name: "course", label: "Курс", required: true },
            { name: "phone", label: "Телефон" },
          ]}
          success="Заявка принята. Учебный центр КФБ свяжется с вами для подтверждения."
        />
        <article className={ui.card}>
          <h2>Как начать</h2>
          <ol>
            <li>Откройте учебную платформу</li>
            <li>Зарегистрируйтесь или войдите как студент</li>
            <li>Выберите курс и проходите уроки онлайн</li>
          </ol>
          <p>
            <a href={eduUrl} {...eduLinkProps(eduUrl)}>
              Перейти на учебную платформу →
            </a>
          </p>
        </article>
      </div>
    </PublicMain>
  );
}
