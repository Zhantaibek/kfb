import Link from "next/link";
import css from "./switch.module.css";

export const concepts = [
  { slug: "premium", n: 1, name: "Premium Corporate" },
  { slug: "editorial", n: 2, name: "Modern Editorial" },
  { slug: "minimal", n: 4, name: "Minimalist Functional" },
  { slug: "creative", n: 5, name: "Creative" },
  { slug: "shyrdak", n: 15, name: "Шырдак" },
  { slug: "plakat", n: 18, name: "Плакат" },
  { slug: "dashboard", n: 19, name: "Дашборд" },
  { slug: "karta", n: 20, name: "Карта" },
  { slug: "kapital", n: 22, name: "Капитал" },
  { slug: "set", n: 23, name: "Сеть" },
  { slug: "limon", n: 24, name: "Лайм" },
  { slug: "dvizhenie", n: 25, name: "Движение" },
  { slug: "poisk", n: 26, name: "Поиск" },
  { slug: "reestr", n: 27, name: "Реестр" },
  { slug: "marshrut", n: 28, name: "Маршрут" },
  { slug: "gosservis", n: 29, name: "Госсервис" },
  { slug: "azbuka", n: 30, name: "Азбука" },
  { slug: "vhody", n: 31, name: "Два входа" },
  { slug: "volna", n: 32, name: "Волна" },
  { slug: "siyanie", n: 33, name: "Сияние" },
  { slug: "vitrina", n: 34, name: "Витрина" },
  { slug: "portal", n: 35, name: "Портал" },
  { slug: "otrasli", n: 36, name: "Отрасли" },
  { slug: "chertezh", n: 37, name: "Чертёж" },
  { slug: "sloi", n: 38, name: "Слои" },
  { slug: "svodka", n: 39, name: "Сводка" },
  { slug: "tishina", n: 40, name: "Тишина" },
  { slug: "prilozhenie", n: 41, name: "Приложение" },
  { slug: "sdelka", n: 42, name: "Сделка" },
  { slug: "sovremennyi", n: 43, name: "Современный" },
  { slug: "invest", n: 44, name: "Инвест" },
  { slug: "zelenyi", n: 45, name: "Зелёный" },
  { slug: "strogiy", n: 46, name: "Строгий" },
  { slug: "tablo", n: 47, name: "Табло" },
  { slug: "vestnik", n: 48, name: "Вестник" },
  { slug: "korporativnyi", n: 49, name: "Корпоративный" },
  { slug: "terminal", n: 50, name: "Терминал" },
] as const;

/** Плашка в углу макета: быстро переключиться на соседний вариант или вернуться к каталогу. */
export function ConceptSwitch({ current }: { current: (typeof concepts)[number]["slug"] }) {
  const currentN = concepts.find((item) => item.slug === current)?.n ?? 0;

  return (
    // Своё имя view-transition: при смене концепции плашка стоит на месте, а страница уезжает в сторону.
    <nav className={css.switch} aria-label="Концепции главной" style={{ viewTransitionName: "kc-switch" }}>
      <Link href="/design-concepts" className={css.all} transitionTypes={["kc-back"]}>
        Все концепции
      </Link>
      {concepts.map((item) => (
        <Link
          key={item.slug}
          href={`/design-concepts/${item.slug}`}
          aria-current={item.slug === current ? "page" : undefined}
          aria-label={`Концепция ${item.n}: ${item.name}`}
          title={item.name}
          transitionTypes={item.n === currentN ? undefined : [item.n > currentN ? "kc-forward" : "kc-back"]}
        >
          {item.n}
        </Link>
      ))}
    </nav>
  );
}
