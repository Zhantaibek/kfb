"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { formatChange, formatSom } from "@/data/catalog";
import { useTr } from "@/lib/use-tr";
import styles from "./HomeHero.module.css";

type Props = {
  index: { value: number; change: number; capitalization: number };
  volume: { value: number; change: number; trades: number };
  listing: { total: number };
};

type Slide = {
  /** Короткое имя для переключателя под слайдом. */
  nav: string;
  kicker: string;
  title: string;
  text: string;
  photo: string;
  /** Кадрирование фото: на широком экране и на телефоне главный объект в разных местах. */
  focus: string;
  focusMobile: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

/**
 * Тексты — из разделов сайта (главная, «Инвесторам», «Итоги торгов», «Листинг»); цифр и обещаний не придумываем.
 * Фото — реальные снимки (Unsplash, авторы в public/hero/CREDITS.md): современное здание с вывеской КФБ
 * (логотип нанесён на фото), деловой раздел газеты, графики торгов, отчёт с графиками.
 */
const SLIDES: Slide[] = [
  {
    nav: "Биржа",
    kicker: "Кыргызская фондовая биржа",
    title: "Инвестиции в стабильное будущее",
    text: "Кыргызская фондовая биржа — это прозрачный и надежный механизм для привлечения капитала, развития бизнеса и роста экономики страны.",
    photo: "/hero/kse-front.jpg",
    focus: "50% 0%",
    focusMobile: "76% 50%",
    primary: { label: "Торговать", href: "/market" },
    secondary: { label: "Подробнее", href: "/about" },
  },
  {
    nav: "Инвесторам",
    kicker: "Инвесторам",
    title: "Как начать инвестировать",
    text: "Частному инвестору нужен счёт у участника торгов. Дальше — выбор акций, облигаций, ГЦБ или драгоценных металлов.",
    photo: "/hero/investor-news.jpg",
    focus: "45% 55%",
    focusMobile: "40% 60%",
    primary: { label: "Выбрать брокера", href: "/members" },
    secondary: { label: "Инвестируйте в ГЦБ", href: "/gcb" },
  },
  {
    nav: "Торги",
    kicker: "Финансовый рынок",
    title: "Итоги торгов",
    text: "Объём торгов по рынкам и сделки по ценным бумагам: последний торговый день, неделя, месяц и год.",
    photo: "/hero/market-charts.jpg",
    focus: "50% 40%",
    focusMobile: "72% 45%",
    primary: { label: "Смотреть итоги", href: "/market" },
    secondary: { label: "Все котировки", href: "/market/quotes" },
  },
  {
    nav: "Эмитентам",
    kicker: "Эмитентам",
    title: "Листинг и раскрытие информации",
    text: "Официальный список ценных бумаг, допущенных к торгам на Кыргызской фондовой бирже.",
    photo: "/hero/issuer-report.jpg",
    focus: "55% 45%",
    focusMobile: "55% 45%",
    primary: { label: "Листинг", href: "/listing" },
    secondary: { label: "Центр раскрытия информации", href: "/disclosure" },
  },
];

/** Сколько показывается слайд и сколько длится смена (CSS: .slide, .fill). */
const INTERVAL_MS = 7000;
const FADE_MS = 1000;

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" style={back ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/**
 * Первый экран главной: слайд-шоу из четырёх композиций — фото во весь баннер, слева поверх светлой дымки
 * текст и кнопки, внизу карточки слайдов (активная — с полосой времени).
 * Смена — каждые 7 секунд: плавное затухание и медленное приближение фото. Пауза — при наведении на
 * карточки и стрелки и при фокусе с клавиатуры (не на всём баннере: он почти во весь экран, и курсор на нём
 * стоял бы постоянно); стрелки ← → на клавиатуре и свайп на телефоне листают слайды.
 * При prefers-reduced-motion слайды листаются, но без приближения фото.
 */
export function HomeHero({ index, volume, listing }: Props) {
  const tr = useTr();
  const tone = (value: number) => (value < 0 ? styles.down : value > 0 ? styles.up : undefined);
  const figure = index.value.toLocaleString("ru-KG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  // Фото грузим по мере надобности: текущий слайд и следующий, а не все четыре сразу.
  const [loaded, setLoaded] = useState<number[]>([0, 1]);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const lastChange = useRef(0);
  const touchStart = useRef<number | null>(null);

  const playing = !hovered && !focused;

  const goTo = useCallback(
    (target: number) => {
      // Новая смена не начинается, пока идёт предыдущая: затухания не накладываются друг на друга.
      const now = Date.now();
      if (now - lastChange.current < FADE_MS * 0.7) return;
      const next = (target + SLIDES.length) % SLIDES.length;
      if (next === active) return;
      lastChange.current = now;
      setPrevious(active);
      setActive(next);
      setLoaded((current) => [...new Set([...current, next, (next + 1) % SLIDES.length])]);
    },
    [active],
  );

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(active - 1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") touchStart.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "touch" || touchStart.current === null) return;
    const delta = event.clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) > 50) goTo(active + (delta < 0 ? 1 : -1));
  }

  // Клик мышью по карточке тоже даёт фокус — такой фокус показ не останавливает, только фокус с клавиатуры.
  function onFocus(event: FocusEvent<HTMLElement>) {
    setFocused(event.target.matches(":focus-visible"));
  }

  const stateOf =(i: number) => (i === active ? "active" : i === previous ? "leaving" : "idle");

  return (
    <section className={styles.hero} aria-label={tr("Главный баннер")}>
      <div
        className={styles.stage}
        role="region"
        aria-roledescription={tr("карусель")}
        aria-label={tr("Кыргызская фондовая биржа")}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onFocus={onFocus}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
        style={{ "--fade": `${FADE_MS}ms` } as CSSProperties}
      >
        {SLIDES.map((slide, i) => {
          const state = stateOf(i);
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <div
              key={slide.photo}
              className={styles.slide}
              data-state={state}
              role="group"
              aria-roledescription={tr("слайд")}
              aria-label={`${i + 1} / ${SLIDES.length}: ${tr(slide.nav)}`}
              aria-hidden={state !== "active"}
              inert={state !== "active"}
              style={{ "--focus": slide.focus, "--focus-mobile": slide.focusMobile } as CSSProperties}
            >
              <div className={styles.content}>
                <div className={styles.copy}>
                  <p className={styles.kicker}>{tr(slide.kicker)}</p>
                  <Heading className={styles.title}>{tr(slide.title)}</Heading>
                  <p className={styles.lead}>{tr(slide.text)}</p>
                  <div className={styles.actions}>
                    <Link className={styles.primary} href={slide.primary.href}>
                      {tr(slide.primary.label)}
                      <Arrow />
                    </Link>
                    <Link className={styles.link} href={slide.secondary.href}>
                      {tr(slide.secondary.label)}
                      <Arrow />
                    </Link>
                  </div>
                </div>

                <div className={styles.frame} aria-hidden="true">
                  {loaded.includes(i) ? (
                    <Image
                      src={slide.photo}
                      alt=""
                      fill
                      sizes="100vw"
                      quality={90}
                      preload={i === 0}
                      loading={i === 0 ? undefined : "eager"}
                      className={styles.photo}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        <div
          className={styles.controls}
          onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
          onPointerLeave={(event) => event.pointerType === "mouse" && setHovered(false)}
        >
          <div className={styles.tabs} role="group" aria-label={tr("Слайды")}>
            {SLIDES.map((slide, i) => (
              <button
                key={slide.nav}
                type="button"
                className={styles.tab}
                aria-current={i === active ? "true" : undefined}
                aria-label={`${tr("Слайд")} ${i + 1}: ${tr(slide.nav)}`}
                onClick={() => goTo(i)}
              >
                <span className={styles.tabNumber}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.tabLabel}>{tr(slide.title)}</span>
                <span className={styles.track} aria-hidden="true">
                  {i === active ? (
                    <i
                      key={active}
                      className={styles.fill}
                      data-playing={playing}
                      style={{ animationDuration: `${INTERVAL_MS}ms` }}
                      onAnimationEnd={() => goTo(active + 1)}
                    />
                  ) : null}
                </span>
              </button>
            ))}
          </div>

          <div className={styles.buttons}>
            <button type="button" className={styles.round} aria-label={tr("Предыдущий слайд")} onClick={() => goTo(active - 1)}>
              <Arrow back />
            </button>
            <button type="button" className={styles.round} aria-label={tr("Следующий слайд")} onClick={() => goTo(active + 1)}>
              <Arrow />
            </button>
          </div>
        </div>

        {/* Для экранных дикторов: какой слайд сейчас показан. */}
        <p className={styles.srOnly} aria-live={playing ? "off" : "polite"}>
          {`${tr("Слайд")} ${active + 1} ${tr("из")} ${SLIDES.length}: ${tr(SLIDES[active].title)}`}
        </p>
      </div>

      <div className={styles.stats}>
        <Link className={styles.stat} href="/market/index">
          <span className={styles.label}>{tr("Индекс KSE")}</span>
          <span className={styles.value}>
            <b>{figure}</b>
            <em className={tone(index.change)}>{formatChange(index.change)}</em>
          </span>
        </Link>
        <Link className={styles.stat} href="/market/index">
          <span className={styles.label}>{tr("Капитализация")}</span>
          <span className={styles.value}>
            <b>{formatSom(index.capitalization)}</b>
            <small>{tr("млрд сом")}</small>
          </span>
        </Link>
        <Link className={styles.stat} href="/market">
          <span className={styles.label}>{tr("Объём торгов")}</span>
          <span className={styles.value}>
            <b>{formatSom(volume.value)}</b>
            <small>{tr("млн сом")}</small>
            <em className={tone(volume.change)}>{formatChange(volume.change)}</em>
          </span>
        </Link>
        <Link className={styles.stat} href="/market/quotes">
          <span className={styles.label}>{tr("Инструменты")}</span>
          <span className={styles.value}>
            <b>{listing.total}</b>
            <small>
              {volume.trades} {tr("сделок")}
            </small>
          </span>
        </Link>
      </div>
    </section>
  );
}
