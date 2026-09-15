import type { CmsMenuItem } from "./cms";

export type NavSeedNode = {
  id: string;
  label: string;
  href: string;
  children?: NavSeedNode[];
};

/** Текущее меню шапки kse.kg — источник seed и запасной вариант на сайте. */
export const defaultHeaderNav: NavSeedNode[] = [
  {
    id: "menu-1",
    label: "О нас",
    href: "/about",
    children: [
      { id: "menu-about-info", label: "Общая информация", href: "/about" },
      { id: "menu-about-shareholders", label: "Акционеры", href: "/about/shareholders" },
      { id: "menu-about-management", label: "Руководство", href: "/about/management" },
      { id: "menu-about-auditor", label: "Внутренний аудитор", href: "/about/auditor" },
      {
        id: "menu-about-committees",
        label: "Комитеты",
        href: "/about/committees",
        children: [
          { id: "menu-about-committees-listing", label: "Листинговый комитет", href: "/about/committees/listing" },
          {
            id: "menu-about-committees-strategy",
            label: "Комитет по стратегическому планированию и корпоративному развитию",
            href: "/about/committees/strategy",
          },
          { id: "menu-about-committees-audit", label: "Комитет по аудиту и вознаграждениям", href: "/about/committees/audit" },
        ],
      },
      {
        id: "menu-about-members",
        label: "Участники торгов",
        href: "/members",
        children: [
          { id: "menu-about-members-all", label: "Участники торгов", href: "/members" },
          { id: "menu-about-members-stdm", label: "Участники торгов СТДМ", href: "/members/stdm" },
          { id: "menu-about-members-commodity", label: "Участники товарно-сырьевого сектора", href: "/members/commodity" },
          { id: "menu-about-members-gcb", label: "Участники торгов ГЦБ", href: "/members/gcb" },
        ],
      },
      { id: "menu-about-partners", label: "Наши партнеры", href: "/about/partners" },
      { id: "menu-about-strategy", label: "Стратегия развития", href: "/about/strategy" },
      { id: "menu-about-documents", label: "Корпоративные документы", href: "/documents" },
      { id: "menu-about-contacts", label: "Контакты", href: "/contacts" },
    ],
  },
  {
    id: "menu-2",
    label: "Направления",
    href: "/listing",
    children: [
      { id: "menu-dir-commodity", label: "Товарно-сырьевой сектор", href: "/commodity" },
      { id: "menu-dir-listing", label: "Листинг", href: "/listing" },
      { id: "menu-dir-disclosure", label: "Центр раскрытия информации", href: "/disclosure" },
      { id: "menu-dir-tariffs", label: "Тарифы", href: "/tariffs" },
      { id: "menu-dir-analytics", label: "Аналитика", href: "/analytics" },
      { id: "menu-dir-finmarket", label: "Финансовый рынок KG", href: "/finmarket" },
      { id: "menu-dir-news", label: "Пресс-клуб", href: "/news" },
      { id: "menu-dir-25", label: "25 лет ЗАО КФБ", href: "/about/25-years" },
    ],
  },
  {
    id: "menu-3",
    label: "Нормативная база",
    href: "/regulations/exchange",
    children: [
      { id: "menu-reg-exchange", label: "Биржевая деятельность", href: "/regulations/exchange" },
      { id: "menu-reg-depository", label: "Депозитарная деятельность", href: "/regulations/depository" },
      { id: "menu-reg-disclosure", label: "Центр раскрытия информации", href: "/disclosure" },
    ],
  },
  {
    id: "menu-4",
    label: "Статистика торгов",
    href: "/market",
    children: [
      { id: "menu-stat-latest", label: "Итоги последних торгов", href: "/market" },
      { id: "menu-stat-archive", label: "Архив торгов", href: "/market/archive" },
      { id: "menu-stat-index", label: "Индекс и Капитализация", href: "/market/index" },
      { id: "menu-stat-quotes", label: "Котировки по ЦБ", href: "/market/quotes" },
      { id: "menu-stat-metals", label: "Котировки по драг. металлам", href: "/market/metals" },
      { id: "menu-stat-gcb", label: "Расписание аукционов по ГЦБ", href: "/gcb" },
      { id: "menu-stat-gcb-results", label: "Результаты аукционов ГЦБ", href: "/gcb/results" },
      { id: "menu-stat-gcb-volume", label: "Объем ГЦБ в обращении", href: "/gcb/volume" },
      { id: "menu-stat-deposits", label: "Результаты аукционов по депозитам", href: "/gcb/deposits" },
    ],
  },
  {
    id: "menu-5",
    label: "Учебный центр",
    href: "/education",
    children: [
      { id: "menu-edu-info", label: "Общая информация", href: "/education" },
      { id: "menu-edu-plan", label: "План работы на год", href: "/education/plan" },
      { id: "menu-edu-online", label: "Онлайн-платформа", href: "http://127.0.0.1:5173/education/app/" },
    ],
  },
];

export function flattenNavSeed(
  nodes: NavSeedNode[] = defaultHeaderNav,
  group = "header",
  parentId: string | null = null,
): CmsMenuItem[] {
  const out: CmsMenuItem[] = [];
  nodes.forEach((node, index) => {
    out.push({
      id: node.id,
      label: node.label,
      href: node.href,
      group,
      order: index + 1,
      parentId,
    });
    if (node.children?.length) {
      out.push(...flattenNavSeed(node.children, group, node.id));
    }
  });
  return out;
}
