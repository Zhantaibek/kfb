"use client";

/* eslint-disable @next/next/no-img-element -- иллюстрации лендинга из /public и медиатеки */
import Link from "next/link";
import type { ReactNode } from "react";
import type { CmsEsgReport, CmsLandingSection, CmsSustainableBond, CmsVerifier } from "@/lib/cms/types";
import { useLocalizedList } from "@/lib/cms/use-localized";
import { useTr } from "@/lib/use-tr";
import { lines, paragraphs, useSections } from "./landing-data";
import css from "./landing.module.css";

type Props = {
  sections: CmsLandingSection[];
  bonds: CmsSustainableBond[];
  reports: CmsEsgReport[];
  verifiers: CmsVerifier[];
};

const anchors = [
  ["about", "О секторе"],
  ["sections", "Направления"],
  ["stocks", "Перечень ЦБ"],
  ["companies", "Организации"],
  ["guide", "Руководство"],
  ["reports", "Отчёты"],
] as const;

/** Лендинг «Сектор устойчивого развития» (как kse.kg/sustainable.html); всё содержимое — из админки. */
export function SustainableView(props: Props) {
  const tr = useTr();
  const section = useSections(props.sections, "sustainable");
  const bonds = useLocalizedList(props.bonds, ["name", "kind", "yieldRate", "standard"]);
  const reports = useLocalizedList(props.reports, ["title"]);
  const verifiers = useLocalizedList(props.verifiers, ["name"]);
  const hero = section("hero");
  const about = section("about");
  const directions = [1, 2, 3, 4, 5, 6].map((n) => section(`direction-${n}`)).filter((item) => item.text || item.title);
  const guide = section("guide");
  const reportsBlock = section("reports");

  return (
    <div className={css.landing}>
      <section className={`${css.hero} ${css.heroDark} ${css.heroPhoto}`}>
        <div>
          {hero.kicker ? <p className={css.kicker}>{hero.kicker}</p> : null}
          <h1>{hero.title || tr("Сектор устойчивого развития")}</h1>
          {paragraphs(hero.text).map((text) => (
            <p key={text} className={css.lead}>
              {text}
            </p>
          ))}
          <div className={css.actions}>
            <a className={css.btn} href="#stocks">
              {tr("Перечень ценных бумаг")}
            </a>
            <a className={css.btnGhost} href="#reports">
              {tr("ESG-отчёты")}
            </a>
          </div>
        </div>
        {hero.photo ? <img src={hero.photo} alt="" /> : null}
      </section>

      <nav className={css.anchors} aria-label={tr("Разделы страницы")}>
        {anchors.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {tr(label)}
          </a>
        ))}
      </nav>

      <section id="about" className={`${css.section} ${css.split}`}>
        {about.photo ? <img src={about.photo} alt="" /> : null}
        <div>
          {about.kicker ? <p className={css.kicker}>{about.kicker}</p> : null}
          <h2>{about.title}</h2>
          {paragraphs(about.text).map((text) => (
            <p key={text} className={css.lead}>
              {text}
            </p>
          ))}
          <ul className={css.ticks}>
            {lines(about.items).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
      {section("rules").text ? (
        <div className={css.prose}>
          {paragraphs(section("rules").text).map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      ) : null}

      <section id="sections" className={css.section}>
        {section("directions").kicker ? <p className={css.kicker}>{section("directions").kicker}</p> : null}
        <h2>{section("directions").title}</h2>
        <div className={css.cards}>
          {directions.map((item, index) => (
            <article key={item.id} className={`${css.card} ${css.cardPhoto}`}>
              {item.photo ? <img src={item.photo} alt="" /> : null}
              <div>
                <span className={css.num}>{String(index + 1).padStart(2, "0")}</span>
                {item.title ? <h3>{item.title}</h3> : null}
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {bonds.length ? (
        <section id="stocks" className={`${css.section} ${css.band}`}>
          <h2>{section("bonds").title}</h2>
          <div className={css.bonds}>
            {bonds.map((bond, index) => (
              <details key={bond.id} className={css.bond} open={index === 0}>
                <summary>
                  {bond.name}
                  {bond.kind ? <small>{bond.kind}</small> : null}
                </summary>
                <dl>
                  {(
                    [
                      ["Регистрационный номер ЦБ", bond.regNumber],
                      ["Описание ценной бумаги", bond.kind],
                      ["Объём выпуска (шт.)", bond.volume],
                      ["Номинал", [bond.nominal, bond.currency].filter(Boolean).join(" ")],
                      ["Доходность", bond.yieldRate],
                      ["Дата начала размещения", bond.startDate],
                      ["Дата погашения", bond.endDate],
                      ["Категория листинга", bond.category],
                      ["Соответствие стандартам", bond.standard],
                    ] as const
                  )
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
                      <Row key={label} label={tr(label)} value={value} />
                    ))}
                  {bond.issuerSlug ? (
                    <Row
                      label={tr("Профиль в ЦРИ КФБ")}
                      value={<Link href={`/disclosure/${bond.issuerSlug}`}>{tr("Перейти")} →</Link>}
                    />
                  ) : null}
                </dl>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {verifiers.length ? (
        <section id="companies" className={`${css.section} ${css.split}`}>
          <div>
            {section("verifiers").kicker ? <p className={css.kicker}>{section("verifiers").kicker}</p> : null}
            <h2>{section("verifiers").title}</h2>
            <ol className={css.orgs}>
              {verifiers.map((item) => (
                <li key={item.id}>
                  {item.site ? (
                    <a href={item.site} target="_blank" rel="noreferrer">
                      {item.name}
                    </a>
                  ) : (
                    <a>{item.name}</a>
                  )}
                </li>
              ))}
            </ol>
          </div>
          {section("verifiers").photo ? <img src={section("verifiers").photo} alt="" /> : null}
        </section>
      ) : null}

      <section id="guide" className={`${css.section} ${css.split}`}>
        {guide.photo ? <img src={guide.photo} alt="" /> : null}
        <div>
          {guide.kicker ? <p className={css.kicker}>{guide.kicker}</p> : null}
          <h2>{guide.title}</h2>
          {paragraphs(guide.text).map((text) => (
            <p key={text} className={css.lead}>
              {text}
            </p>
          ))}
          {guide.link ? (
            <div className={css.actions}>
              <a className={css.btn} href={guide.link} target="_blank" rel="noreferrer">
                {tr("Открыть руководство")}
              </a>
            </div>
          ) : null}
        </div>
      </section>

      {reports.length ? (
        <section id="reports" className={css.section}>
          {reportsBlock.kicker ? <p className={css.kicker}>{reportsBlock.kicker}</p> : null}
          <h2>{reportsBlock.title}</h2>
          <div className={css.reports}>
            {reports.map((item) => (
              <a key={item.id} className={css.report} href={item.file || undefined} target="_blank" rel="noreferrer">
                {reportsBlock.photo ? <img src={reportsBlock.photo} alt="" /> : null}
                <b>{item.title}</b>
                <span>{item.file ? `${tr("Смотреть PDF")} →` : tr("Файл не загружен")}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
