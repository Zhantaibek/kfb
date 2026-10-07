"use client";

/* eslint-disable @next/next/no-img-element -- иллюстрации лендинга из /public и медиатеки */
import Link from "next/link";
import type { ReactNode } from "react";
import type { CmsGcbParticipant, CmsLandingSection, CmsNews } from "@/lib/cms/types";
import { useLocalizedList } from "@/lib/cms/use-localized";
import { useTr } from "@/lib/use-tr";
import { GcbBuyForm, GcbCompanies } from "./GcbParts";
import { lines, paragraphs, useSections } from "./landing-data";
import css from "./landing.module.css";

type Props = {
  sections: CmsLandingSection[];
  participants: CmsGcbParticipant[];
  news: CmsNews[];
};

/** Значки карточек преимуществ — по порядку блоков feature-1…feature-6. */
const icons: ReactNode[] = [
  <path key="money" d="M3 6h18v12H3V6Zm2 2v8h14V8H5Zm7 1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />,
  <path key="chart" d="M4 19h16v2H4v-2Zm1-3 4-5 3 3 6-7 1.5 1.3-7.4 8.7-3-3-2.6 3.2L5 16Z" />,
  <path key="shield" d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1 13.4-3.4-3.4 1.4-1.4 2 2 4.6-4.6 1.4 1.4-6 6Z" />,
  <path key="swap" d="M7 7h11l-3-3 1.4-1.4L21.8 8l-5.4 5.4L15 12l3-3H7V7Zm10 10H6l3 3-1.4 1.4L2.2 16l5.4-5.4L9 12l-3 3h11v2Z" />,
  <path key="check" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.2 13.6 6.3-6.3-1.4-1.4-4.9 4.9-2.3-2.3-1.4 1.4 3.7 3.7Z" />,
  <path key="repo" d="M12 4a8 8 0 0 1 7.7 6H22l-3.5 4-3.5-4h2.6A6 6 0 0 0 6.3 9L4.6 8A8 8 0 0 1 12 4Zm-6.5 6 3.5 4H6.4a6 6 0 0 0 11.3 1l1.7 1A8 8 0 0 1 4.3 14H2l3.5-4Z" />,
];

const anchors = [
  ["features", "Преимущества"],
  ["earn", "Доход"],
  ["listing", "Листинг"],
  ["buy", "Как купить"],
  ["news", "Новости"],
  ["form", "Заявка"],
] as const;

/** Лендинг «Инвестиции в ГЦБ» (как kse.kg/gsb.html); всё содержимое — из админки. */
export function GcbView(props: Props) {
  const tr = useTr();
  const section = useSections(props.sections, "gcb");
  const participants = useLocalizedList(props.participants, ["title"]);
  const news = useLocalizedList(props.news, ["title", "excerpt", "tag"]);
  const hero = section("hero");
  const features = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => section(`feature-${n}`)).filter((item) => item.title || item.text);

  const split = (key: string, imageFirst: boolean, extra?: ReactNode) => {
    const block = section(key);
    const image = block.photo ? <img src={block.photo} alt="" /> : null;
    return (
      <section id={key} className={`${css.section} ${css.split}`}>
        {imageFirst ? image : null}
        <div className={css.prose}>
          <h2>{block.title}</h2>
          {paragraphs(block.text).map((text) => (
            <p key={text}>{text}</p>
          ))}
          {extra}
        </div>
        {imageFirst ? null : image}
      </section>
    );
  };

  return (
    <div className={css.landing}>
      <section className={css.hero}>
        <div>
          {hero.kicker ? <p className={css.kicker}>{hero.kicker}</p> : null}
          <h1>{hero.title || tr("Инвестиции в ГЦБ")}</h1>
          {paragraphs(hero.text).map((text) => (
            <p key={text} className={css.lead} style={{ marginBottom: 10 }}>
              {text}
            </p>
          ))}
          <ul className={css.ticks}>
            {lines(hero.items).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className={css.actions}>
            <a className={css.btn} href="#form">
              {tr("Купить ГЦБ")}
            </a>
            <Link className={css.btnGhost} href="/gcb">
              {tr("Расписание аукционов")}
            </Link>
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

      <section id="features" className={css.section}>
        <h2>{section("features").title}</h2>
        {paragraphs(section("features").text).map((text) => (
          <p key={text} className={css.lead}>
            {text}
          </p>
        ))}
        <div className={css.cards}>
          {features.map((item, index) => (
            <article key={item.id} className={css.card}>
              <span className={css.cardIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {icons[index % icons.length]}
                </svg>
              </span>
              <h3>{item.title}</h3>
              {paragraphs(item.text).map((text) => (
                <p key={text}>{text}</p>
              ))}
            </article>
          ))}
        </div>
      </section>

      {split("earn", false)}
      {split(
        "listing",
        true,
        <div className={css.actions}>
          <Link className={css.btnGhost} href="/listing">
            {tr("Список листинга")}
          </Link>
        </div>,
      )}

      <section id="buy" className={css.section}>
        <h2>{section("buy").title}</h2>
        {paragraphs(section("buy").text).map((text) => (
          <p key={text} className={css.lead}>
            {text}
          </p>
        ))}
        <GcbCompanies companies={participants} />
      </section>

      {news.length ? (
        <section id="news" className={css.section}>
          <h2>{section("news").title}</h2>
          <div className={css.news}>
            {news.slice(0, 3).map((item) => (
              <Link key={item.id} className={css.card} href={`/news/${item.slug}`}>
                <p className={css.kicker} style={{ margin: 0 }}>
                  {item.tag} · {item.date}
                </p>
                <h3>{item.title}</h3>
                {item.excerpt ? <p>{item.excerpt}</p> : null}
                <span className={css.more}>{tr("Продолжить")} →</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="form" className={`${css.section} ${css.formBand}`}>
        <GcbBuyForm block={section("form")} />
      </section>
    </div>
  );
}
