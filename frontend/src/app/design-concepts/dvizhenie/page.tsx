import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EDU_URL } from "@/lib/edu";
import { loadIssuerData } from "@/lib/cms/public";
import { ConceptPage, Words } from "../_shared/ConceptPage";
import { ConceptSwitch } from "../_shared/ConceptSwitch";
import { num, steps } from "../_shared/data";
import { loadHomeData } from "../_shared/home-data";
import { regionShapes } from "../karta/kgz-map";
import { regionOf } from "../karta/regions";
import css from "./dvizhenie.module.css";
import {
  BeamCard,
  FlapBoard,
  IndexString,
  Iris,
  LiquidLink,
  LiveRank,
  MagneticLink,
  MarketBubbles,
  Mosaic,
  NewsDeck,
  Odometer,
  ParticleWord,
  PriceDrums,
  RidgeHero,
  ScrollText,
  SpeedTape,
  Torch,
  Trail,
  Tunduk,
} from "./effects";
import { Curtains, DotMap, LiveForm, LiveIcons, LiveTitle, PhotoFolds, PhotoTrail, SessionClock } from "./more-effects";

/*
 * Концепция 25 — «Движение»: не вариант главной, а витрина анимаций для сайта КФБ. Все эффекты — в effects.tsx,
 * каждый можно перенести на сайт отдельно. Данные настоящие: индекс, котировки и шаги инвестора с главной.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "25 · Движение" };

const scenes = [
  { label: "Биржа", photo: "/hero/kse-entrance-garden.jpg" },
  { label: "Бишкек", photo: "/hero/bishkek-ala-too.jpg" },
  { label: "Торги", photo: "/hero/market-charts.jpg" },
  { label: "Эмитенты", photo: "/hero/issuer-signing.jpg" },
];

const effects = [
  "Индекс-хребет",
  "Табло",
  "Частицы",
  "Живой рейтинг",
  "Тропа инвестора",
  "Тюндюк",
  "Окно из клика",
  "Мелочи",
  "Лента скорости",
  "Струна индекса",
  "Текст от прокрутки",
  "Пузыри рынка",
  "Колода новостей",
  "Мозаика",
  "Луч",
  "Шторы",
  "Живые иконки",
  "Часы сессии",
  "Карта из точек",
  "Гармошка",
  "Живой заголовок",
  "След из фото",
  "Живая форма",
];

const curtains = [
  { label: "Торги", path: "/market", title: "Итоги торгов", photo: "/carousel/trading.jpg" },
  { label: "Листинг", path: "/listing", title: "Листинг компаний", photo: "/hub/hub-listing.jpg" },
  { label: "ГЦБ", path: "/gcb", title: "Аукционы ГЦБ", photo: "/hub/hub-gcb.jpg" },
  { label: "Новости", path: "/news", title: "Новости биржи", photo: "/hub/hub-news.jpg" },
];

const folds = [
  { title: "Инвесторам", text: "Счёт у брокера, первые акции и облигации.", href: "/investors", photo: "/hub/hub-market.jpg" },
  { title: "Листинг", text: "Размещение акций и облигаций на бирже.", href: "/listing", photo: "/hub/hub-listing.jpg" },
  { title: "ГЦБ", text: "Государственные ценные бумаги через аукционы.", href: "/gcb", photo: "/hub/hub-gcb.jpg" },
  { title: "Раскрытие", text: "Отчётность и сообщения эмитентов.", href: "/disclosure", photo: "/hub/hub-disclosure.jpg" },
  { title: "Учебный центр", text: "Курсы о том, как устроен рынок ценных бумаг.", href: EDU_URL, photo: "/hub/hub-education.jpg" },
];

const trailPhotos = ["/carousel/city.jpg", "/carousel/gold.jpg", "/carousel/meeting.jpg", "/carousel/mountains.jpg", "/carousel/office.jpg", "/carousel/trading.jpg"];

function Demo({ n, title, text, where, children }: { n: number; title: string; text: string; where: string; children: ReactNode }) {
  return (
    <section className={css.demo} id={`e${n}`}>
      <header className={css.demoHead} data-reveal>
        <span className={css.demoN}>{String(n).padStart(2, "0")}</span>
        <h2>{title}</h2>
        <p>{text}</p>
        <p className={css.where}>
          <b>Где на сайте:</b> {where}
        </p>
      </header>
      {children}
    </section>
  );
}

export default async function MotionConcept() {
  const [data, issuerData] = await Promise.all([loadHomeData(), loadIssuerData()]);
  const papers = data.instruments
    .filter((item) => item.price > 0)
    .map(({ ticker, name, type, price, volume }) => ({ ticker, name, type, price, volume }));
  const indexText = num(data.index.value, 2).replace(/\s/g, " ");
  const regions = regionShapes.map(({ id }) => ({ id, count: issuerData.issuers.filter((issuer) => regionOf(issuer.address ?? "") === id).length }));

  return (
    <ConceptPage accent="#57b6c0">
      <main className={css.page}>
        <RidgeHero values={data.indexSeries.map((row) => row.value)}>
          <p className={css.kicker}>Кыргызская фондовая биржа · витрина анимаций</p>
          <h1 data-intro="words">
            <Words text="Рынок, который движется" />
          </h1>
          <p className={css.lead}>Вершины этих гор — настоящие значения индекса за последние сессии. Ниже ещё двадцать две идеи для сайта.</p>
          <p className={css.heroIndex}>
            <span>Индекс KSE</span>
            <strong>
              <Odometer text={indexText} intro />
            </strong>
          </p>
          <nav className={css.toc} aria-label="Эффекты">
            {effects.map((name, i) => (
              <a key={name} href={`#e${i + 1}`}>
                {name}
              </a>
            ))}
          </nav>
        </RidgeHero>

        <section className={css.demo} id="e1">
          <header className={css.demoHead} data-reveal>
            <span className={css.demoN}>01</span>
            <h2>Индекс-хребет</h2>
            <p>Первый экран выше: график индекса становится линией гор Ала-Тоо. Линия рисуется, слои гор поднимаются и следуют за курсором, цифры индекса прокручиваются на барабанах.</p>
            <p className={css.where}>
              <b>Где на сайте:</b> первый экран главной, страница индекса.
            </p>
          </header>
        </section>

        <Demo n={2} title="Табло" text="Котировки на перекидном табло, как на вокзале: пластины листаются до нужного символа, страницы бумаг сменяются сами." where="блок котировок на главной, страница «Итоги торгов».">
          <FlapBoard papers={papers} />
        </Demo>

        <Demo n={3} title="Частицы" text="Надпись из тысяч точек: собирается, рассыпается и складывается в новое слово. Проведите курсором или нажмите." where="заголовок раздела «О бирже», страница 404, годовой отчёт.">
          <ParticleWord words={["KSE", indexText, "КФБ"]} />
        </Demo>

        <Demo n={4} title="Живой рейтинг" text="При смене сортировки строки переезжают на новые места, а не перерисовываются. Глаз успевает проследить, какая бумага куда ушла." where="таблицы котировок, лидеры недели, список эмитентов.">
          <LiveRank papers={papers.slice(0, 7)} />
        </Demo>

        <Demo n={5} title="Тропа инвестора" text="Шаги «Как начать инвестировать» как подъём в гору. Прокрутка ведёт точку по серпантину, небо светлеет к вершине." where="раздел «Инвесторам», блок шагов на главной.">
          <Trail steps={steps.map(({ title, text }) => ({ title, text }))} />
        </Demo>

        <Demo n={6} title="Тюндюк" text="Купол юрты собирается по линиям, поворачивается на место, и от него расходятся лучи. Национальный символ вместо обычного индикатора загрузки." where="заставка при первом входе, загрузка страниц.">
          <Tunduk />
        </Demo>

        <Demo n={7} title="Окно из клика" text="Следующий кадр раскрывается кругом от того места, куда нажали. Нажмите в любую точку фото." where="баннер главной, переходы между разделами.">
          <Iris scenes={scenes} />
        </Demo>

        <Demo n={8} title="Мелочи" text="Небольшие эффекты, из которых складывается ощущение дорогого интерфейса." where="кнопки, карточки сервисов, цифры в сводке рынка.">
          <div className={css.micro}>
            <div className={css.microCell}>
              <MagneticLink href="/market">Кнопка-магнит</MagneticLink>
            </div>
            <div className={css.microCell}>
              <LiquidLink href="/listing">Кнопка-волна</LiquidLink>
            </div>
            <div className={css.microCell}>
              <BeamCard href="/gcb" title="Аукционы ГЦБ" text="Луч света вокруг карточки" />
            </div>
            <div className={css.microCell}>
              <PriceDrums papers={papers.slice(0, 5)} />
            </div>
          </div>
        </Demo>

        <Demo n={9} title="Лента скорости" text="Бегущая строка чувствует прокрутку: разгоняется, наклоняется, а при прокрутке вверх разворачивается." where="разделитель между блоками главной, замена бегущей строки в шапке.">
          <SpeedTape items={papers.slice(0, 10).map((paper) => `${paper.ticker} ${num(paper.price, 2).replace(/\s/g, " ")}`)} />
        </Demo>

        <Demo n={10} title="Струна индекса" text="График как струна комуза. Схватите линию, оттяните и отпустите: она зазвенит и затихнет. Подпись показывает дату и значение под курсором." where="страница индекса, блок индекса на главной.">
          <IndexString points={data.indexSeries.map(({ date, value }) => ({ date, value }))} />
        </Demo>

        <Demo n={11} title="Текст от прокрутки" text="Абзац проявляется слово за словом: читатель сам ведёт текст." where="«О бирже», миссия, годовой отчёт.">
          <ScrollText text="Кыргызская фондовая биржа — это прозрачный и надежный механизм для привлечения капитала, развития бизнеса и роста экономики страны." />
        </Demo>

        <Demo n={12} title="Пузыри рынка" text="Бумаги падают в стакан и толкаются. Размер шара — цена, цвет — вид бумаги. Шары можно хватать и бросать." where="страница «Рынок», раздел для новичков.">
          <MarketBubbles papers={papers.slice(0, 18)} />
        </Demo>

        <Demo n={13} title="Колода новостей" text="Верхнюю карточку смахивают в сторону, следующая поднимается на её место. На телефоне это привычный жест." where="новости на главной в мобильной версии.">
          <NewsDeck news={data.news.map(({ slug, title, tag, date, photo }) => ({ slug, title, tag, date, photo }))} />
        </Demo>

        <Demo n={14} title="Мозаика" text="Фото сложено из плиток, как войлочный шырдак. Плитки переворачиваются волной от места нажатия, с обратной стороны — новый кадр." where="галерея, баннер раздела «О бирже».">
          <Mosaic photos={scenes.map((scene) => scene.photo)} />
        </Demo>

        <Demo n={15} title="Луч" text="Тёмная гравюра города, а под лучом — цветное фото и главная мысль. Без курсора луч сам бродит по кадру." where="блок о прозрачности рынка, страница раскрытия информации.">
          <Torch photo="/hero/bishkek-ala-too.jpg" title="Прозрачный рынок" />
        </Demo>

        <Demo n={16} title="Шторы" text="Переход между страницами: цветные полосы закрывают экран по очереди и уезжают, открывая новый раздел." where="переходы между разделами всего сайта.">
          <Curtains pages={curtains} />
        </Demo>

        <Demo n={17} title="Живые иконки" text="Значки разделов оживают при наведении: столбики растут, галочка рисуется, в окнах загорается свет." where="меню, карточки разделов, подвал.">
          <LiveIcons />
        </Demo>

        <Demo n={18} title="Часы сессии" text="Циферблат суток по Бишкеку: дуга показывает часы торгов, стрелка — настоящее время, отсчёт до открытия или закрытия идёт на барабанах." where="шапка рынка на главной, страница «Рынок».">
          <SessionClock />
        </Demo>

        <Demo n={19} title="Карта из точек" text="Кыргызстан из точек разворачивается от Бишкека. Яркость области — число эмитентов по адресам из их карточек. Наведите на область или нажмите, чтобы пустить волну." where="страница эмитентов, «О бирже».">
          <DotMap regions={regions} />
        </Demo>

        <Demo n={20} title="Гармошка" text="Фото-полосы разделов: та, что под курсором, раскрывается, остальные сжимаются." where="блок «Куда дальше» на главной.">
          <PhotoFolds items={folds} />
        </Demo>

        <Demo n={21} title="Живой заголовок" text="Буквы набухают и приподнимаются рядом с курсором, словно под ними проходит волна." where="крупные заголовки разделов.">
          <LiveTitle text="Кыргызская фондовая биржа" />
        </Demo>

        <Demo n={22} title="След из фото" text="Курсор оставляет цепочку снимков, которые появляются и тают. Без курсора след рисуется сам." where="«О бирже», страница карьеры или событий.">
          <PhotoTrail photos={trailPhotos} hint="Проведите курсором по этому блоку" />
        </Demo>

        <Demo n={23} title="Живая форма" text="Подпись всплывает, ошибка встряхивает поле, кнопка превращается в индикатор и галочку. Попробуйте ввести неверный адрес." where="формы заявок, подписка на новости, вход.">
          <LiveForm />
        </Demo>
      </main>
      <ConceptSwitch current="dvizhenie" />
    </ConceptPage>
  );
}
