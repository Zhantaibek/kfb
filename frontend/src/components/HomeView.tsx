"use client";

import Image from "next/image";
import Link from "next/link";
import { HeroSlider, type HeroSlide } from "@/components/HeroSlider";
import { MarketPulse, Sparkline } from "@/components/MarketPulse";
import { applyLocale } from "@/lib/cms/locale";
import type { CmsI18n } from "@/lib/cms/types";
import { useLang, useTr } from "@/lib/use-tr";
import { formatChange, formatSom } from "@/data/catalog";
import styles from "@/app/page.module.css";

const newsPhotos = ["/carousel/meeting.jpg", "/carousel/city.jpg", "/carousel/mountains.jpg"];

export type HomeNews = {
  slug: string;
  tag: string;
  date: string;
  title: string;
  excerpt: string;
  photo?: string;
  i18n?: CmsI18n;
};

export type HomeHub = {
  href: string;
  title: string;
  text: string;
  photo: string;
  i18n?: CmsI18n;
};

type Props = {
  slides: HeroSlide[];
  news: HomeNews[];
  session: { open: boolean; clock: string; label: string; hours: string; date: string };
  index: { value: number; change: number; history: number[]; capitalization: number };
  volume: { value: number; change: number; trades: number };
  listing: { total: number; stocks: number; gcb: number; metals: number };
  gold?: { price: number; change: number };
  hubs: HomeHub[];
};

export function HomeView({ slides, news, session, index, volume, listing, gold, hubs }: Props) {
  const tr = useTr();
  const lang = useLang();
  const localizedSlides = slides.map((item) => applyLocale(item, lang, ["title", "text", "value"]));
  const localizedNews = news.map((item) => applyLocale(item, lang, ["title", "excerpt", "tag"]));
  const localizedHubs = hubs.map((item) => applyLocale(item, lang, ["title", "text"]));
  const featured = localizedNews[0];
  const restNews = localizedNews.slice(1);

  return (
    <div className={styles.page}>
      <main>
        <HeroSlider slides={localizedSlides} />

        <section className={styles.snapshot} aria-label={tr("Снимок рынка")}>
          <article className={styles.snapCard} data-live={session.open ? "open" : "closed"}>
            <small>
              {tr("Бишкек")} {session.clock}
            </small>
            <b>{tr(session.label)}</b>
            <em>{tr(`${session.hours} · данные на ${session.date}`)}</em>
          </article>
          <article className={styles.snapCard}>
            <small>{tr("Индекс KSE")}</small>
            <b>{index.value.toLocaleString("ru-KG", { maximumFractionDigits: 2 })}</b>
            <em className={index.change < 0 ? styles.down : styles.up}>{formatChange(index.change)}</em>
            <Sparkline className={styles.snapSpark} values={index.history} />
          </article>
          <article className={styles.snapCard}>
            <small>{tr("Капитализация")}</small>
            <b>{index.capitalization.toLocaleString("ru-KG")}</b>
            <em>{tr("млрд сом")}</em>
          </article>
          <article className={styles.snapCard}>
            <small>{tr("Объём торгов")}</small>
            <b>{volume.value.toLocaleString("ru-KG", { maximumFractionDigits: 4 })}</b>
            <em className={volume.change > 0 ? styles.up : styles.down}>
              {formatChange(volume.change)} · {tr(`${volume.trades} сделок`)}
            </em>
          </article>
          <article className={styles.snapCard}>
            <small>{tr("Листинг")}</small>
            <b>{listing.total}</b>
            <em>{tr(`${listing.stocks} акц. · ${listing.gcb} ГЦБ · ${listing.metals} металлы`)}</em>
          </article>
          <article className={styles.snapCard}>
            <small>{tr("Золото 1 г")}</small>
            <b>{gold ? formatSom(gold.price) : "—"}</b>
            <em className={gold && gold.change < 0 ? styles.down : styles.up}>{gold ? formatChange(gold.change) : ""}</em>
          </article>
        </section>

        <MarketPulse />

        <section className={styles.newsHome} aria-labelledby="news-title">
          <div className={styles.blockHead}>
            <h2 id="news-title">{tr("Новости")}</h2>
            <Link href="/news">{tr("Все новости")}</Link>
          </div>
          {featured ? (
            <Link className={styles.featured} href={`/news/${featured.slug}`}>
              <div className={styles.featuredArt} style={{ position: "relative" }}>
                <Image src={featured.photo || newsPhotos[0]} alt="" fill sizes="640px" />
              </div>
              <div>
                <span>
                  {tr(featured.tag)} · {featured.date}
                </span>
                <h3>{tr(featured.title)}</h3>
                <p>{tr(featured.excerpt)}</p>
              </div>
            </Link>
          ) : null}
          <div className={styles.newsList}>
            {restNews.map((item, i) => (
              <Link href={`/news/${item.slug}`} key={item.slug}>
                <small>
                  {tr(item.tag)} · {item.date}
                </small>
                <b>{tr(item.title)}</b>
                <span className={styles.newsThumb} style={{ position: "relative" }}>
                  <Image src={item.photo || newsPhotos[(i + 1) % newsPhotos.length]} alt="" fill sizes="72px" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.hub} aria-labelledby="hub-title">
          <div className={styles.blockHead}>
            <h2 id="hub-title">{tr("Разделы")}</h2>
          </div>
          <nav className={styles.hubNav} aria-label={tr("Ключевые разделы")}>
            {localizedHubs.map((item, index) => (
              <Link href={item.href} key={item.href} data-wide={index === 0 ? "true" : undefined}>
                <span className={styles.hubCopy}>
                  <b>{tr(item.title)}</b>
                  <small>{tr(item.text)}</small>
                </span>
                <span className={styles.hubArt}>
                  <Image src={item.photo} alt="" fill sizes={index === 0 ? "640px" : "360px"} />
                </span>
              </Link>
            ))}
          </nav>
        </section>
      </main>
    </div>
  );
}
