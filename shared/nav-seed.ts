import type { CmsI18n, CmsMenuItem } from "./cms";

export type NavSeedNode = {
  id: string;
  label: string;
  href: string;
  i18n?: CmsI18n;
  children?: NavSeedNode[];
};

/** Строка навигации в шапке — шесть разделов, как в шапке kse.kg (группа меню «primary»). */
export const defaultPrimaryNav: NavSeedNode[] = [
  { id: "menu-top-about", label: "О Бирже", href: "/about", i18n: { ky: { label: "Биржа жөнүндө" }, en: { label: "About the Exchange" } } },
  { id: "menu-top-listing", label: "Листинг", href: "/listing", i18n: { ky: { label: "Листинг" }, en: { label: "Listing" } } },
  { id: "menu-top-market", label: "Статистика торгов", href: "/statistics", i18n: { ky: { label: "Соода статистикасы" }, en: { label: "Trading statistics" } } },
  {
    id: "menu-top-disclosure",
    label: "Центр раскрытия информации",
    href: "/disclosure",
    i18n: { ky: { label: "Маалыматты ачыкка чыгаруу борбору" }, en: { label: "Information Disclosure Center" } },
  },
  {
    id: "menu-top-sustainable",
    label: "Сектор устойчивого развития",
    href: "/sustainable",
    i18n: { ky: { label: "Туруктуу өнүгүү сектору" }, en: { label: "Sustainable development sector" } },
  },
  {
    id: "menu-top-gcb-invest",
    label: "Инвестиции в ГЦБ",
    href: "/gcb/invest",
    i18n: { ky: { label: "МБКга инвестициялар" }, en: { label: "Investing in government securities" } },
  },
];

/**
 * Футер (группа «footer»): верхний уровень — заголовки колонок, вложенные — ссылки.
 * Повторяет колонки, которые раньше собирались из первых трёх групп бургер-меню.
 */
export const defaultFooterNav: NavSeedNode[] = [
  {
    id: "menu-foot-1",
    label: "О нас",
    href: "/about",
    i18n: { ky: { label: "Биз жөнүндө" }, en: { label: "About us" } },
    children: [
      { id: "menu-foot-1-1", label: "О бирже", href: "/about", i18n: { ky: { label: "Биржа жөнүндө" }, en: { label: "About the exchange" } } },
      { id: "menu-foot-1-2", label: "Органы управления", href: "/about/governance", i18n: { ky: { label: "Башкаруу органдары" }, en: { label: "Governing bodies" } } },
      { id: "menu-foot-1-3", label: "Историческая справка", href: "/about/history", i18n: { ky: { label: "Тарыхый маалымат" }, en: { label: "History" } } },
      { id: "menu-foot-1-4", label: "Акционеры", href: "/about/shareholders", i18n: { ky: { label: "Акционерлер" }, en: { label: "Shareholders" } } },
    ],
  },
  {
    id: "menu-foot-2",
    label: "Направления",
    href: "/listing",
    i18n: { ky: { label: "Багыттар" }, en: { label: "Business lines" } },
    children: [
      { id: "menu-foot-2-1", label: "Товарно-сырьевой сектор", href: "/commodity", i18n: { ky: { label: "Товар-чийки зат сектору" }, en: { label: "Commodities sector" } } },
      { id: "menu-foot-2-2", label: "Листинг", href: "/listing", i18n: { ky: { label: "Листинг" }, en: { label: "Listing" } } },
      { id: "menu-foot-2-3", label: "Центр раскрытия информации", href: "/disclosure", i18n: { ky: { label: "Маалыматты ачыктоо борбору" }, en: { label: "Disclosure centre" } } },
      { id: "menu-foot-2-4", label: "Тарифы", href: "/tariffs", i18n: { ky: { label: "Тарифтер" }, en: { label: "Fees" } } },
    ],
  },
  {
    id: "menu-foot-3",
    label: "Нормативная база",
    href: "/regulations/exchange",
    i18n: { ky: { label: "Ченемдик база" }, en: { label: "Regulation" } },
    children: [
      { id: "menu-foot-3-1", label: "Биржевая деятельность", href: "/regulations/exchange", i18n: { ky: { label: "Биржа ишмердүүлүгү" }, en: { label: "Exchange operations" } } },
      { id: "menu-foot-3-2", label: "Депозитарная деятельность", href: "/regulations/depository", i18n: { ky: { label: "Депозитардык ишмердүүлүк" }, en: { label: "Depository operations" } } },
      { id: "menu-foot-3-3", label: "Центр раскрытия информации", href: "/regulations/disclosure", i18n: { ky: { label: "Маалыматты ачыктоо борбору" }, en: { label: "Disclosure centre" } } },
    ],
  },
];

/** Две кнопки в баннере футера (группа «footer-buttons»). */
export const defaultFooterButtons: NavSeedNode[] = [
  { id: "menu-foot-btn-market", label: "Открыть торги", href: "/market", i18n: { ky: { label: "Сооданы ачуу" }, en: { label: "Open trading" } } },
  { id: "menu-foot-btn-contacts", label: "Написать в КФБ", href: "/contacts", i18n: { ky: { label: "КФБга жазуу" }, en: { label: "Write to KSE" } } },
];

/** Ссылки с иконкой документа рядом с телефонами (группа «footer-links»). */
export const defaultFooterLinks: NavSeedNode[] = [
  { id: "menu-foot-doc-rules", label: "Правила и тарифы", href: "/documents", i18n: { ky: { label: "Эрежелер жана тарифтер" }, en: { label: "Rules and fees" } } },
  { id: "menu-foot-doc-disclosure", label: "Раскрытие", href: "/disclosure", i18n: { ky: { label: "Ачыктоо" }, en: { label: "Disclosure" } } },
];

/** Текущее меню шапки kse.kg — источник seed и запасной вариант на сайте. */
export const defaultHeaderNav: NavSeedNode[] = [
  {
    id: "menu-1",
    label: "О нас",
    href: "/about",
    children: [
      { id: "menu-about-info", label: "Общая информация", href: "/about" },
      { id: "menu-about-governance", label: "Органы управления", href: "/about/governance" },
      { id: "menu-about-history", label: "Историческая справка", href: "/about/history" },
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
          { id: "menu-about-members-rating", label: "Рейтинг участников", href: "/members/rating" },
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
      { id: "menu-dir-news", label: "Пресс-клуб", href: "/press-club" },
      { id: "menu-dir-25", label: "25 лет ЗАО КФБ", href: "/about/25-years" },
      { id: "menu-dir-sustainable", label: "Сектор устойчивого развития", href: "/sustainable" },
      { id: "menu-dir-gcb-invest", label: "Инвестиции в ГЦБ", href: "/gcb/invest" },
    ],
  },
  {
    id: "menu-3",
    label: "Нормативная база",
    href: "/regulations/exchange",
    children: [
      { id: "menu-reg-exchange", label: "Биржевая деятельность", href: "/regulations/exchange" },
      { id: "menu-reg-depository", label: "Депозитарная деятельность", href: "/regulations/depository" },
      { id: "menu-reg-disclosure", label: "Центр раскрытия информации", href: "/regulations/disclosure" },
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
      { id: "menu-edu-online", label: "Онлайн-платформа", href: "/education/app" },
    ],
  },
];

/** Карточки раздела «О Бирже» (/about), как на kse.kg/ru/GeneralInfo. */
export const defaultHubAbout: NavSeedNode[] = [
  { id: "menu-hub-about-management", label: "Органы управления", href: "/about/management", i18n: { ky: { label: "Башкаруу органдары" }, en: { label: "Governing bodies" } } },
  { id: "menu-hub-about-history", label: "Историческая справка", href: "/about/history", i18n: { ky: { label: "Тарыхый маалымат" }, en: { label: "Historical background" } } },
  {
    id: "menu-hub-about-strategy",
    label: "Стратегия развития ЗАО «КФБ» на 2026-2030 годы",
    href: "/about/strategy",
    i18n: { ky: { label: "«КФБ» ЖАКтын 2026-2030-жылдарга өнүгүү стратегиясы" }, en: { label: "KSE CJSC development strategy for 2026-2030" } },
  },
];

/** Карточки раздела «Статистика торгов» (/statistics), как на kse.kg/ru/Statistics. */
export const defaultHubStatistics: NavSeedNode[] = [
  { id: "menu-hub-stat-results", label: "Итоги последних торгов", href: "/market", i18n: { ky: { label: "Акыркы сооданын жыйынтыктары" }, en: { label: "Latest trading results" } } },
  { id: "menu-hub-stat-archive", label: "Архив торгов", href: "/market/archive", i18n: { ky: { label: "Соода архиви" }, en: { label: "Trading archive" } } },
  { id: "menu-hub-stat-index", label: "Индекс и Капитализация", href: "/market/index", i18n: { ky: { label: "Индекс жана капиталдаштыруу" }, en: { label: "Index and capitalization" } } },
  { id: "menu-hub-stat-quotes", label: "Котировки", href: "/market/quotes", i18n: { ky: { label: "Котировкалар" }, en: { label: "Quotes" } } },
  { id: "menu-hub-stat-gcb", label: "Расписание аукционов по ГЦБ", href: "/gcb", i18n: { ky: { label: "МБК аукциондорунун графиги" }, en: { label: "Government securities auction schedule" } } },
];

/** Все пункты меню из seed: дерево бургера (header) и строка навигации шапки (primary). */
export function allNavSeed(): CmsMenuItem[] {
  return [
    ...flattenNavSeed(),
    ...flattenNavSeed(defaultPrimaryNav, "primary"),
    ...flattenNavSeed(defaultFooterNav, "footer"),
    ...flattenNavSeed(defaultFooterButtons, "footer-buttons"),
    ...flattenNavSeed(defaultFooterLinks, "footer-links"),
    ...flattenNavSeed(defaultHubAbout, "hub-about"),
    ...flattenNavSeed(defaultHubStatistics, "hub-statistics"),
  ];
}

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
      ...(node.i18n ? { i18n: node.i18n } : {}),
    });
    if (node.children?.length) {
      out.push(...flattenNavSeed(node.children, group, node.id));
    }
  });
  return out;
}
