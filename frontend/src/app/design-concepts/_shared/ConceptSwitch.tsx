import Link from "next/link";
import css from "./switch.module.css";

export const concepts = [
  { slug: "premium", n: 1, name: "Premium Corporate" },
  { slug: "editorial", n: 2, name: "Modern Editorial" },
  { slug: "shyrdak", n: 15, name: "Шырдак" },
  { slug: "kapital", n: 22, name: "Капитал" },
  { slug: "set", n: 23, name: "Сеть" },
  { slug: "portal", n: 35, name: "Портал" },
  { slug: "otrasli", n: 36, name: "Отрасли" },
  { slug: "chertezh", n: 37, name: "Чертёж" },
  { slug: "zelenyi", n: 45, name: "Зелёный" },
  { slug: "strogiy", n: 46, name: "Строгий" },
  { slug: "korporativnyi", n: 49, name: "Корпоративный" },
  { slug: "terminal", n: 50, name: "Терминал" },
  { slug: "prosto", n: 51, name: "Просто" },
  { slug: "gran", n: 53, name: "Грань" },
  { slug: "siniy", n: 54, name: "Синий" },
  { slug: "pult", n: 55, name: "Пульт" },
  { slug: "modul", n: 56, name: "Модуль" },
  { slug: "yantar", n: 57, name: "Янтарь" },
  { slug: "neon", n: 58, name: "Неон" },
  { slug: "lazur", n: 59, name: "Лазурь" },
  { slug: "ekran", n: 60, name: "Экран" },
  { slug: "polden", n: 61, name: "Полдень" },
  { slug: "priliv", n: 62, name: "Прилив" },
  { slug: "split", n: 63, name: "Сплит" },
  { slug: "kanon", n: 64, name: "Канон" },
  { slug: "obzor", n: 65, name: "Обзор" },
  { slug: "moneta", n: 66, name: "Монета" },
  { slug: "spektr", n: 67, name: "Спектр" },
  { slug: "karta2", n: 68, name: "Карта" },
  { slug: "bento", n: 69, name: "Бенто" },
  { slug: "gorizont", n: 70, name: "Горизонт" },
  { slug: "gazeta", n: 71, name: "Газета" },
  { slug: "panorama", n: 72, name: "Панорама" },
  { slug: "ukazatel", n: 73, name: "Указатель" },
  { slug: "kartoteka", n: 74, name: "Картотека" },
  { slug: "hronika", n: 75, name: "Хроника" },
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
