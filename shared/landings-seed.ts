/**
 * Начальные данные лендингов kse.kg/sustainable.html и kse.kg/gsb.html.
 * При первом запуске переносятся в БД (sustainable_bonds, esg_reports, verifiers, gcb_participants, landing_sections),
 * дальше правятся в админке.
 */
import type {
  CmsEsgReport,
  CmsGcbParticipant,
  CmsLandingSection,
  CmsNews,
  CmsSustainableBond,
  CmsVerifier,
} from "./cms";

const at = "2026-10-06T00:00:00.000Z";
const kse = (path: string) => encodeURI(`https://www.kse.kg/${path}`);

type Text = { ru: string; ky: string; en: string };

function i18nOf(fields: Record<string, Text>) {
  const ky: Record<string, string> = {};
  const en: Record<string, string> = {};
  for (const [field, text] of Object.entries(fields)) {
    ky[field] = text.ky;
    en[field] = text.en;
  }
  return { ky, en };
}

function ruOf<K extends string>(fields: Record<K, Text>) {
  return Object.fromEntries(Object.entries(fields).map(([field, text]) => [field, (text as Text).ru])) as Record<K, string>;
}

// ── Сектор устойчивого развития ──────────────────────────────────────────

const social: Text = { ru: "социальная облигация", ky: "социалдык облигация", en: "social bond" };
const green: Text = { ru: "зелёная облигация", ky: "жашыл облигация", en: "green bond" };
const socialStd: Text = {
  ru: "Принципы социальных облигаций Международной ассоциации рынков капитала (ICMA)",
  ky: "Капитал рыногунун эл аралык ассоциациясынын (ICMA) социалдык облигацияларынын принциптери",
  en: "Social Bond Principles of the International Capital Market Association (ICMA)",
};
const greenStd: Text = {
  ru: "Принципы зелёных облигаций Международной ассоциации рынков капитала (ICMA)",
  ky: "Капитал рыногунун эл аралык ассоциациясынын (ICMA) жашыл облигацияларынын принциптери",
  en: "Green Bond Principles of the International Capital Market Association (ICMA)",
};
const yearly = (rate: number): Text => ({ ru: `${rate}% годовых`, ky: `жылдык ${rate}%`, en: `${rate}% per annum` });

function bond(
  order: number,
  id: string,
  name: Text,
  issuerSlug: string,
  fields: { regNumber: string; volume: string; start: string; end: string },
  kind: Text,
  yieldRate: Text,
  standard: Text,
): CmsSustainableBond {
  const texts = { name, kind, yieldRate, standard };
  return {
    id: `bond-${id}`,
    ...ruOf(texts),
    issuerSlug,
    regNumber: fields.regNumber,
    volume: fields.volume,
    nominal: "1 000",
    currency: "сом",
    startDate: fields.start,
    endDate: fields.end,
    category: "В",
    order,
    status: "published",
    i18n: i18nOf(texts),
    updatedAt: at,
  };
}

export const sustainableBondsSeed: CmsSustainableBond[] = [
  bond(
    1,
    "basa-1",
    { ru: "ЗАО Банк Азии (1-выпуск)", ky: "«Азия Банкы» ЖАК (1-чыгаруу)", en: "Bank of Asia CJSC (issue 1)" },
    "CJSC_BankAsia",
    { regNumber: "KG0201105119", volume: "82 000", start: "18.11.2022", end: "18.11.2025" },
    social,
    yearly(12),
    socialStd,
  ),
  bond(
    2,
    "basa-2",
    { ru: "ЗАО Банк Азии (2-выпуск)", ky: "«Азия Банкы» ЖАК (2-чыгаруу)", en: "Bank of Asia CJSC (issue 2)" },
    "CJSC_BankAsia",
    { regNumber: "KG0202105118", volume: "100 000", start: "02.07.2024", end: "18.11.2025" },
    social,
    yearly(12),
    socialStd,
  ),
  bond(
    3,
    "dkrb-1",
    { ru: "ОАО Дос-Кредобанк (1-выпуск)", ky: "«Дос-Кредобанк» ААК (1-чыгаруу)", en: "Dos-Credobank OJSC (issue 1)" },
    "JSC_DosKredobank",
    { regNumber: "KG0201085816", volume: "85 000", start: "13.06.2023", end: "13.06.2026" },
    green,
    yearly(16),
    greenStd,
  ),
  bond(
    4,
    "rbsk-1",
    { ru: "ОАО Элдик Банк", ky: "«Элдик Банк» ААК", en: "Eldik Bank OJSC" },
    "JSC_RSCBank",
    { regNumber: "KG02011096011", volume: "200 000", start: "31.12.2024", end: "03.12.2027" },
    { ru: "облигация устойчивого развития", ky: "туруктуу өнүгүү облигациясы", en: "sustainability bond" },
    yearly(11),
    greenStd,
  ),
];

const report = (order: number, title: Text, path: string): CmsEsgReport => ({
  id: `esg-report-${order}`,
  title: title.ru,
  file: kse(path),
  order,
  status: "published",
  i18n: i18nOf({ title }),
  updatedAt: at,
});

const sd = (company: Text, year: number): Text => ({
  ru: `${company.ru} — Отчёт об устойчивом развитии ${year}`,
  ky: `${company.ky} — ${year}-жылдагы туруктуу өнүгүү боюнча отчёт`,
  en: `${company.en} — Sustainability Report ${year}`,
});
const halyk: Text = { ru: "ОАО Халык Банк Кыргызстан", ky: "«Халык Банк Кыргызстан» ААК", en: "Halyk Bank Kyrgyzstan OJSC" };
const eldik: Text = { ru: "ОАО Элдик Банк", ky: "«Элдик Банк» ААК", en: "Eldik Bank OJSC" };
const dcb: Text = { ru: "ОАО Дос-Кредобанк", ky: "«Дос-Кредобанк» ААК", en: "Dos-Credobank OJSC" };
const asia: Text = { ru: "ЗАО Банк Азии", ky: "«Азия Банкы» ЖАК", en: "Bank of Asia CJSC" };
const oxus: Text = { ru: "ЗАО МФК ОКСУС", ky: "«ОКСУС» МФК ЖАК", en: "OXUS MFC CJSC" };
const kick: Text = { ru: "ОАО «Kicksharing Central Asia»", ky: "«Kicksharing Central Asia» ААК", en: "Kicksharing Central Asia OJSC" };

export const esgReportsSeed: CmsEsgReport[] = [
  report(1, sd(halyk, 2022), "Sustainable/ESG_Sustainability_Report_2022.pdf"),
  report(2, sd(eldik, 2023), "Sustainable/Отчет_по_устойчивому_развитию_2023_ОАО_Элдик_Банк.pdf"),
  report(3, sd(dcb, 2023), "Sustainable/PRINT_Book_DCB_RU_compressed_MFVBj6l.pdf"),
  report(4, sd(asia, 2023), "Sustainable/ОТЧЕТ ОБ УСТОЙЧИВОМ РАЗВИТИИ ЗАО«БАНК АЗИИ»2023 год.pdf"),
  report(5, sd(oxus, 2024), "Sustainable/OKG SD Report _2024, русс.pdf"),
  report(6, sd(kick, 2024), "Sustainable/Kicksharing.pdf"),
  report(7, sd(asia, 2024), "Sustainable/sustainable_report_bank_asia.pdf"),
  report(8, sd(eldik, 2024), "Sustainable/Отчет_по_устойчивому_развитию_2024_ОАО_Элдик_Банк.pdf"),
  report(9, sd(dcb, 2024), "Sustainable/Sustainability_Report_Dos_Credobank_OJSC.pdf"),
  report(10, sd(asia, 2025), "Sustainable/esg-otchet-2025.pdf"),
];

const verifier = (order: number, name: Text, site: string): CmsVerifier => ({
  id: `verifier-${order}`,
  name: name.ru,
  site,
  order,
  status: "published",
  i18n: i18nOf({ name }),
  updatedAt: at,
});

export const verifiersSeed: CmsVerifier[] = [
  verifier(1, { ru: "AIFC Green Finance Center Ltd", ky: "AIFC Green Finance Center Ltd", en: "AIFC Green Finance Center Ltd" }, "https://gfc.aifc.kz/en"),
  verifier(2, { ru: "Эксперт РА", ky: "Эксперт РА", en: "Expert RA" }, "https://raexpert.ru/about/"),
  verifier(
    3,
    {
      ru: "Аналитическое кредитное рейтинговое агентство (АКРА)",
      ky: "Аналитикалык кредиттик рейтинг агенттиги (АКРА)",
      en: "Analytical Credit Rating Agency (ACRA)",
    },
    "https://www.acra-ratings.ru/",
  ),
  verifier(4, { ru: "Национальное Рейтинговое Агентство", ky: "Улуттук рейтинг агенттиги", en: "National Rating Agency" }, "https://www.ra-national.ru/"),
  verifier(5, { ru: "Green Investment Group", ky: "Green Investment Group", en: "Green Investment Group" }, "http://greeninvest.kz/ru"),
  verifier(6, { ru: "S&P Global Ratings", ky: "S&P Global Ratings", en: "S&P Global Ratings" }, "https://www.spglobal.com/ratings/en/index"),
  verifier(
    7,
    {
      ru: "Центрально-Азиатский институт экологических исследований (CAIER)",
      ky: "Борбордук Азия экологиялык изилдөөлөр институту (CAIER)",
      en: "Central Asian Institute for Ecological Research (CAIER)",
    },
    "https://asianecology.kz/",
  ),
];

// ── Инвестиции в ГЦБ ─────────────────────────────────────────────────────

const participant = (
  order: number,
  type: CmsGcbParticipant["type"],
  title: Text,
  address: string,
  phones: string[],
  emails: string[],
  website: string,
): CmsGcbParticipant => ({
  id: `gcb-participant-${order}`,
  title: title.ru,
  type,
  address,
  phones: phones.join("\n"),
  emails: emails.join("\n"),
  website,
  order,
  status: "published",
  i18n: i18nOf({ title }),
  updatedAt: at,
});

export const gcbParticipantsSeed: CmsGcbParticipant[] = [
  participant(1, "broker", { ru: "ОАО НПФ «Кыргызстан»", ky: "«Кыргызстан» МПФ ААК", en: "NPF Kyrgyzstan OJSC" }, "г. Бишкек, ул. Коенкозова, 66", ["+996 (312) 66-58-82"], ["npfk_kr@mail.ru"], "http://www.npf.kg"),
  participant(
    2,
    "broker",
    { ru: "ОсОО Финансовый Центр «Аскоинвест»", ky: "«Аскоинвест» каржы борбору ЖЧК", en: "Askoinvest Financial Center LLC" },
    "БЦ «Россия», ул. Раззакова, 19 (4 этаж, 406 кабинет)",
    ["+996 (312) 31 72 62"],
    ["askoinvest@mail.ru"],
    "",
  ),
  participant(
    3,
    "broker",
    { ru: "ОсОО «BNC Finance»", ky: "«BNC Finance» ЖЧК", en: "BNC Finance LLC" },
    "г. Бишкек, ул. Шопокова, 93/2, офис 701",
    ["+996 (312) 586-000", "+996 (312) 587-000", "+996 (550) 222-444", "+996 (557) 577-778", "+996 (702) 777-000"],
    ["tilek.eraliev@gmail.com", "bnc.finance.ib@gmail.com"],
    "http://my.bnc.kg/",
  ),
  participant(
    4,
    "broker",
    { ru: "ОсОО ФК «Сенти»", ky: "«Сенти» КК ЖЧК", en: "Senti FC LLC" },
    "720001, г. Бишкек, пр. Чуй, 219 (9-й этаж)",
    ["+996 (312) 61-45-84", "+996 (312) 61-45-89", "+996 (312) 61-46-21"],
    ["senti@senti.kg"],
    "http://senti.kg/",
  ),
  participant(5, "broker", { ru: "ОсОО «Фридом Брокер»", ky: "«Фридом Брокер» ЖЧК", en: "Freedom Broker LLC" }, "г. Бишкек, пр. Чынгыза Айтматова, 243", ["+996 (312) 91-19-89"], ["office@ffin.kg"], "https://fbroker.kg/"),
  participant(6, "bank", { ru: "ОАО «Айыл Банк»", ky: "«Айыл Банк» ААК", en: "Aiyl Bank OJSC" }, "г. Бишкек, ул. Логвиненко, 14", ["+996 (312) 68 00 00"], [], "https://www.ab.kg/"),
  participant(7, "bank", { ru: "ОАО «РСК Банк»", ky: "«РСК Банк» ААК", en: "RSK Bank OJSC" }, "г. Бишкек, ул. Московская, 80/1", ["+996 (312) 35-55-55"], ["info@rsk.kg"], "https://www.rsk.kg/"),
  participant(8, "bank", { ru: "ОАО «Керемет Банк»", ky: "«Керемет Банк» ААК", en: "Keremet Bank OJSC" }, "г. Бишкек, ул. Тоголок Молдо, 40/4", ["+996 (312) 55 44 44"], ["call-center@keremetbank.kg"], "https://keremetbank.kg/"),
  participant(9, "bank", { ru: "ОАО «Оптима Банк»", ky: "«Оптима Банк» ААК", en: "Optima Bank OJSC" }, "", ["+996 (312) 90 59 59"], [], "https://www.optimabank.kg/"),
  participant(10, "bank", { ru: "ОАО «Дос-Кредобанк»", ky: "«Дос-Кредобанк» ААК", en: "Dos-Credobank OJSC" }, "г. Бишкек, пр. Чуй, 92, 6 этаж", ["8686"], ["office@doscredobank.kg"], "https://www.dcb.kg/"),
];

// ── Текстовые блоки ──────────────────────────────────────────────────────

type SectionTexts = Partial<Record<"kicker" | "title" | "text" | "items", Text>>;

function section(page: CmsLandingSection["page"], order: number, key: string, texts: SectionTexts, extra: { link?: string; photo?: string } = {}): CmsLandingSection {
  return {
    id: `landing-${page}-${key}`,
    page,
    key,
    kicker: texts.kicker?.ru ?? "",
    title: texts.title?.ru ?? "",
    text: texts.text?.ru ?? "",
    items: texts.items?.ru ?? "",
    link: extra.link ?? "",
    photo: extra.photo ?? "",
    order,
    i18n: i18nOf(texts as Record<string, Text>),
    updatedAt: at,
  };
}

export const landingSectionsSeed: CmsLandingSection[] = [
  section(
    "sustainable",
    1,
    "hero",
    {
      kicker: { ru: "Сектор устойчивого развития КФБ", ky: "КФБнын туруктуу өнүгүү сектору", en: "KSE Sustainable Development Sector" },
      title: {
        ru: "Наша миссия — приверженность Целям устойчивого развития и продвижение устойчивых финансов",
        ky: "Биздин миссия — Туруктуу өнүгүү максаттарына берилгендик жана туруктуу каржыны илгерилетүү",
        en: "Our mission is commitment to the Sustainable Development Goals and promotion of sustainable finance",
      },
      text: {
        ru: "Сектор устойчивого развития КФБ создан с целью формирования системы устойчивого финансирования через привлечение ответственных инвестиций в экологически и социально значимые проекты.",
        ky: "КФБнын туруктуу өнүгүү сектору экологиялык жана социалдык маанилүү долбоорлорго жоопкерчиликтүү инвестицияларды тартуу аркылуу туруктуу каржылоо системасын түзүү максатында түзүлгөн.",
        en: "The KSE Sustainable Development Sector was created to build a sustainable finance system by attracting responsible investment into environmentally and socially significant projects.",
      },
    },
    { photo: "/landing/sust-project-earth.jpg" },
  ),
  section(
    "sustainable",
    2,
    "about",
    {
      kicker: { ru: "О секторе", ky: "Сектор жөнүндө", en: "About the sector" },
      title: {
        ru: "В сектор могут быть включены устойчивые финансовые инструменты",
        ky: "Секторго туруктуу каржы инструменттери киргизилиши мүмкүн",
        en: "The sector may include sustainable financial instruments",
      },
      text: {
        ru: "В том числе зелёные, социальные облигации, облигации устойчивого развития, выпущенные частными, государственными или международными организациями, которые соответствуют принципам:",
        ky: "Анын ичинде жеке, мамлекеттик же эл аралык уюмдар чыгарган жашыл, социалдык облигациялар жана туруктуу өнүгүү облигациялары, эгер алар төмөнкү принциптерге ылайык келсе:",
        en: "Including green, social and sustainability bonds issued by private, government or international organisations that comply with the following principles:",
      },
      items: {
        ru: "Принципы зелёных облигаций (GBP)\nПринципы социальных облигаций (SBP)\nПринципы зелёного кредитования (LMA, LSTA)",
        ky: "Жашыл облигациялардын принциптери (GBP)\nСоциалдык облигациялардын принциптери (SBP)\nЖашыл кредиттөөнүн принциптери (LMA, LSTA)",
        en: "Green Bond Principles (GBP)\nSocial Bond Principles (SBP)\nGreen Loan Principles (LMA, LSTA)",
      },
    },
    { photo: "/landing/sust-project-img2.jpg" },
  ),
  section("sustainable", 3, "rules", {
    text: {
      ru: "Инструменты должны соответствовать принципам (GBP, SBP, SBG, SLBP) Международной ассоциации рынков капитала (ICMA) и стандартам Climate Bonds Initiative (CBI), пройти процедуру верификации, а также процедуру листинга по Правилам листинга ЗАО «Кыргызская фондовая биржа».\n\nВерификатор, проводивший оценку выпуска, должен входить в перечень верификаторов, утверждённых КФБ, или в список верификаторов ICMA либо CBI.\n\nРаскрытие информации о соблюдении критериев экологичности, социальной ответственности и корпоративного управления (ESG) производится по международным стандартам нефинансовой отчётности и Руководству КФБ по составлению ESG-отчётности.",
      ky: "Инструменттер Капитал рыногунун эл аралык ассоциациясынын (ICMA) принциптерине (GBP, SBP, SBG, SLBP) жана Climate Bonds Initiative (CBI) стандарттарына ылайык келиши, верификациядан жана «Кыргыз фондулук биржасы» ЖАКтын листинг эрежелери боюнча листинг жол-жобосунан өтүшү керек.\n\nЧыгарылышка баа берген верификатор КФБ бекиткен верификаторлордун тизмесинде же ICMA же CBI верификаторлорунун тизмесинде болушу керек.\n\nЭкологиялык, социалдык жоопкерчилик жана корпоративдик башкаруу (ESG) критерийлеринин сакталышы тууралуу маалымат финансылык эмес отчёттуулуктун эл аралык стандарттарына жана КФБнын ESG-отчёттуулукту түзүү боюнча колдонмосуна ылайык ачыкка чыгарылат.",
      en: "Instruments must comply with the International Capital Market Association (ICMA) principles (GBP, SBP, SBG, SLBP) and Climate Bonds Initiative (CBI) standards, pass verification and the listing procedure under the Listing Rules of Kyrgyz Stock Exchange CJSC.\n\nThe verifier that assessed the issue must be on the list of verifiers approved by KSE or on the ICMA or CBI list of verifiers.\n\nInformation on compliance with environmental, social and governance (ESG) criteria is disclosed under international non-financial reporting standards and the KSE ESG Reporting Guide.",
    },
  }),
  section("sustainable", 4, "directions", {
    kicker: { ru: "Направления развития", ky: "Өнүгүү багыттары", en: "Areas of development" },
    title: {
      ru: "Основными направлениями КФБ в рамках развития сектора обозначены:",
      ky: "Секторду өнүктүрүү алкагында КФБнын негизги багыттары:",
      en: "The main areas of KSE work in developing the sector are:",
    },
  }),
  section(
    "sustainable",
    5,
    "direction-1",
    {
      text: {
        ru: "Создание условий и продвижение устойчивых инструментов финансирования, таких как зелёные, социальные облигации и облигации устойчивого развития",
        ky: "Жашыл, социалдык облигациялар жана туруктуу өнүгүү облигациялары сыяктуу туруктуу каржылоо инструменттери үчүн шарттарды түзүү жана аларды илгерилетүү",
        en: "Creating conditions for and promoting sustainable financing instruments such as green, social and sustainability bonds",
      },
    },
    { photo: "/landing/sust-service-img-1.jpg" },
  ),
  section(
    "sustainable",
    6,
    "direction-2",
    {
      text: {
        ru: "Применение руководства о раскрытии нефинансовой отчётности листинговыми и публичными компаниями страны о соблюдении ESG-критериев",
        ky: "Өлкөнүн листингдик жана ачык компаниялары тарабынан ESG-критерийлердин сакталышы тууралуу финансылык эмес отчёттуулукту ачыкка чыгаруу боюнча колдонмону колдонуу",
        en: "Applying the guide on non-financial disclosure of ESG compliance by the country's listed and public companies",
      },
    },
    { photo: "/landing/sust-service-img-2.jpg" },
  ),
  section(
    "sustainable",
    7,
    "direction-3",
    {
      text: {
        ru: "Реализация политики устойчивого развития Кыргызской фондовой биржи через взаимодействие с различными заинтересованными сторонами",
        ky: "Ар кандай кызыкдар тараптар менен өз ара аракеттенүү аркылуу Кыргыз фондулук биржасынын туруктуу өнүгүү саясатын ишке ашыруу",
        en: "Implementing the Kyrgyz Stock Exchange sustainable development policy through engagement with various stakeholders",
      },
    },
    { photo: "/landing/sust-service-img-3.jpg" },
  ),
  section("sustainable", 8, "bonds", {
    title: {
      ru: "Перечень ценных бумаг Сектора устойчивого развития",
      ky: "Туруктуу өнүгүү секторунун баалуу кагаздарынын тизмеси",
      en: "Securities of the Sustainable Development Sector",
    },
  }),
  section(
    "sustainable",
    9,
    "verifiers",
    {
      kicker: { ru: "Организации", ky: "Уюмдар", en: "Organisations" },
      title: {
        ru: "Перечень организаций для проведения независимой оценки",
        ky: "Көз карандысыз баа берүүнү жүргүзүүчү уюмдардын тизмеси",
        en: "Organisations for independent assessment",
      },
    },
    { photo: "/landing/sust-process-img-1.jpg" },
  ),
  section(
    "sustainable",
    10,
    "guide",
    {
      kicker: { ru: "Раскрытие информации", ky: "Маалыматты ачыкка чыгаруу", en: "Disclosure" },
      title: { ru: "Руководство по составлению ESG-отчётности", ky: "ESG-отчёттуулукту түзүү боюнча колдонмо", en: "ESG Reporting Guide" },
      text: {
        ru: "По критериям экологичности, социальной ответственности и корпоративного управления",
        ky: "Экологиялуулук, социалдык жоопкерчилик жана корпоративдик башкаруу критерийлери боюнча",
        en: "On environmental, social and corporate governance criteria",
      },
    },
    { link: kse("files/files/ESG_Guide_KSE_ru.pdf"), photo: "/landing/sust-banner.jpg" },
  ),
  section(
    "sustainable",
    11,
    "reports",
    {
      kicker: { ru: "ESG-отчёты", ky: "ESG-отчёттор", en: "ESG reports" },
      title: { ru: "Отчёты компаний об устойчивом развитии", ky: "Компаниялардын туруктуу өнүгүү боюнча отчёттору", en: "Company sustainability reports" },
    },
    { photo: "/landing/sust-ESG_photo.jpg" },
  ),

  section(
    "gcb",
    1,
    "hero",
    {
      kicker: { ru: "Инвестиции в ГЦБ", ky: "МБКга инвестициялар", en: "Investing in government securities" },
      title: {
        ru: "Инвестируйте в государственные ценные бумаги",
        ky: "Мамлекеттик баалуу кагаздарга инвестиция салыңыз",
        en: "Invest in government securities",
      },
      text: {
        ru: "Государственные ценные бумаги — это один из самых надёжных инструментов инвестирования, которые выпускает само государство в лице Министерства финансов КР.\n\nНа торговой площадке Кыргызской фондовой биржи (КФБ) можно купить государственные ценные бумаги (ГЦБ) двух видов:",
        ky: "Мамлекеттик баалуу кагаздар — мамлекет өзү КР Финансы министрлиги аркылуу чыгарган эң ишенимдүү инвестициялык инструменттердин бири.\n\nКыргыз фондулук биржасынын (КФБ) соода аянтчасында мамлекеттик баалуу кагаздардын (МБК) эки түрүн сатып алууга болот:",
        en: "Government securities are among the most reliable investment instruments; they are issued by the state itself through the Ministry of Finance of the Kyrgyz Republic.\n\nTwo types of government securities can be bought on the Kyrgyz Stock Exchange (KSE) trading platform:",
      },
      items: {
        ru: "Государственные казначейские векселя сроком обращения 12 месяцев (ГКВ-12)\nГосударственные казначейские облигации сроком обращения 2 года (ГКО-2)",
        ky: "Жүгүртүү мөөнөтү 12 ай болгон мамлекеттик казыналык векселдер (МКВ-12)\nЖүгүртүү мөөнөтү 2 жыл болгон мамлекеттик казыналык облигациялар (МКО-2)",
        en: "12-month government treasury bills (GKV-12)\n2-year government treasury bonds (GKO-2)",
      },
    },
    { photo: "/landing/gsb-undraw_investing_7u74.svg" },
  ),
  section("gcb", 2, "features", {
    title: { ru: "Зачем государство выпускает ГКВ и ГКО?", ky: "Мамлекет МКВ жана МКОну эмне үчүн чыгарат?", en: "Why does the state issue GKV and GKO?" },
    text: {
      ru: "Государственные ценные бумаги выпускаются для финансирования национальных проектов, дефицита бюджета и рефинансирования госдолга, по которому наступает срок платежей. Фактически это публичные долговые обязательства государства.",
      ky: "Мамлекеттик баалуу кагаздар улуттук долбоорлорду, бюджеттин тартыштыгын каржылоо жана төлөө мөөнөтү келген мамлекеттик карызды кайра каржылоо үчүн чыгарылат. Иш жүзүндө бул мамлекеттин ачык карыз милдеттенмелери.",
      en: "Government securities are issued to finance national projects and the budget deficit and to refinance public debt falling due. In effect, they are the state's public debt obligations.",
    },
  }),
  ...[
    {
      title: { ru: "Высокая доходность", ky: "Жогорку кирешелүүлүк", en: "High returns" },
      text: {
        ru: "Покупая ГЦБ, инвестор изначально знает, сколько он получит в итоге. Государство делает прозрачной схему расчёта процентного дохода.",
        ky: "МБК сатып алып жатып, инвестор акырында канча аларын алдын ала билет. Мамлекет пайыздык кирешени эсептөө схемасын ачык кылат.",
        en: "When buying government securities, investors know from the start how much they will receive. The state makes the interest calculation transparent.",
      },
    },
    {
      title: { ru: "Слабая зависимость бумаг от рынка акций", ky: "Акциялар рыногунан аз көз карандылык", en: "Low dependence on the stock market" },
      text: {
        ru: "Если популярные акции падают, это совсем не значит, что снизятся и выплаты по ГЦБ. Грамотно подобранные активы делают портфель более стабильным.",
        ky: "Белгилүү акциялар арзандаса, бул МБК боюнча төлөмдөр да азаят дегенди билдирбейт. Туура тандалган активдер портфелди туруктуураак кылат.",
        en: "If popular shares fall, it does not mean payments on government securities will fall too. Well-chosen assets make a portfolio more stable.",
      },
    },
    {
      title: { ru: "Низкий уровень риска", ky: "Тобокелдиктин төмөн деңгээли", en: "Low risk" },
      text: {
        ru: "Колебания стоимости ГЦБ меньше, чем у акций. По этой причине они хорошо подходят инвесторам, которые не любят рисковать.",
        ky: "МБКнын наркынын өзгөрүшү акцияларга караганда азыраак. Ошондуктан алар тобокелге барууну жактырбаган инвесторлорго ылайыктуу.",
        en: "Government securities fluctuate less in value than shares, so they suit investors who prefer to avoid risk.",
      },
    },
    {
      title: { ru: "Возможность продать ГЦБ в любой момент", ky: "МБКны каалаган убакта сатуу мүмкүнчүлүгү", en: "Sell at any time" },
      text: {
        ru: "Это условие делает ГЦБ более удобным инструментом в сравнении с банковским депозитом.",
        ky: "Бул шарт МБКны банктык депозитке салыштырмалуу ыңгайлуураак инструмент кылат.",
        en: "This makes government securities more convenient than a bank deposit.",
      },
    },
    {
      title: { ru: "Гарантированная выплата", ky: "Кепилденген төлөм", en: "Guaranteed payment" },
      text: {
        ru: "Выплаты по ГЦБ предусмотрены в государственном бюджете и всегда производятся в срок. Таким образом государство выступает гарантом надёжности инвестиций.",
        ky: "МБК боюнча төлөмдөр мамлекеттик бюджетте каралган жана дайыма өз убагында жүргүзүлөт. Ошентип мамлекет инвестициялардын ишенимдүүлүгүнүн кепилдиги болуп саналат.",
        en: "Payments on government securities are provided for in the state budget and are always made on time, so the state guarantees the reliability of the investment.",
      },
    },
    {
      title: { ru: "РЕПО-операции", ky: "РЕПО-операциялар", en: "Repo transactions" },
      text: {
        ru: "ГЦБ можно использовать при РЕПО-операциях — это сделка продажи ценных бумаг с обязательством выкупить их в определённый срок по заранее оговорённой цене.",
        ky: "МБКны РЕПО-операцияларда колдонсо болот — бул баалуу кагаздарды белгиленген мөөнөттө алдын ала макулдашылган баада кайра сатып алуу милдеттенмеси менен сатуу бүтүмү.",
        en: "Government securities can be used in repo transactions — a sale of securities with an obligation to buy them back on a set date at a pre-agreed price.",
      },
    },
  ].map((texts, index) => section("gcb", 3 + index, `feature-${index + 1}`, texts)),
  section(
    "gcb",
    9,
    "earn",
    {
      title: { ru: "Как на этом можно заработать?", ky: "Мындан кантип киреше табууга болот?", en: "How can you earn from this?" },
      text: {
        ru: "ГКВ выпускают на 12 месяцев, погашают по номиналу 100 сомов. Бумаги продают с дисконтом, то есть немного дешевле, например, по 86–87 сомов.\n\nДопустим, вы купили ценные бумаги за 86–87 сомов, но через год Минфин КР вернёт вам 100 сомов. Эти 13–14 сомов и есть ваш доход.\n\nГКО — это купонные ценные бумаги. Их тоже продают чуть дешевле номинала. Сейчас у двухлетних ГКО купонный доход — 5 процентов годовых. При их покупке каждые полгода вы получаете 2,5 процента купонного дохода. Через два года вам возвращают основную сумму инвестиций, то есть погашают по номиналу, а не по цене покупки.",
        ky: "МКВ 12 айга чыгарылат жана 100 сом номиналы боюнча төлөнөт. Кагаздар дисконт менен, башкача айтканда бир аз арзаныраак, мисалы, 86–87 сомдон сатылат.\n\nМисалы, сиз баалуу кагаздарды 86–87 сомго сатып алдыңыз, ал эми бир жылдан кийин КР Финансы министрлиги сизге 100 сом кайтарат. Ошол 13–14 сом сиздин кирешеңиз.\n\nМКО — купондук баалуу кагаздар. Алар да номиналдан бир аз арзан сатылат. Учурда эки жылдык МКОнун купондук кирешеси жылдык 5 пайыз. Аларды сатып алганда ар бир жарым жылда 2,5 пайыз купондук киреше аласыз. Эки жылдан кийин инвестициянын негизги суммасы кайтарылат, башкача айтканда сатып алуу баасы боюнча эмес, номинал боюнча төлөнөт.",
        en: "GKVs are issued for 12 months and redeemed at the face value of 100 som. They are sold at a discount, i.e. slightly cheaper, for example at 86–87 som.\n\nSay you bought the securities for 86–87 som; a year later the Ministry of Finance returns 100 som to you. Those 13–14 som are your income.\n\nGKOs are coupon securities. They are also sold slightly below face value. Two-year GKOs currently pay a 5% annual coupon: you receive 2.5% coupon income every six months. After two years the principal is returned at face value rather than at the purchase price.",
      },
    },
    { photo: "/landing/gsb-undraw_metrics_gtu7.svg" },
  ),
  section(
    "gcb",
    10,
    "listing",
    {
      title: { ru: "Листинг на КФБ", ky: "КФБдагы листинг", en: "Listing on KSE" },
      text: {
        ru: "ГКО-2 и ГКВ-12 включены в листинг Кыргызской фондовой биржи по наивысшей категории «А».\n\nСогласно Налоговому кодексу Кыргызской Республики, проценты и доход от прироста стоимости ценных бумаг, находящихся в листинге КФБ в категории «А», не облагаются подоходным налогом и налогом на прибыль.",
        ky: "МКО-2 жана МКВ-12 Кыргыз фондулук биржасынын листингине эң жогорку «А» категориясы боюнча киргизилген.\n\nКыргыз Республикасынын Салык кодексине ылайык, КФБнын листингинде «А» категориясында турган баалуу кагаздар боюнча пайыздар жана наркынын өсүшүнөн түшкөн киреше киреше салыгына жана пайдага салыкка тартылбайт.",
        en: "GKO-2 and GKV-12 are listed on the Kyrgyz Stock Exchange in the top category “A”.\n\nUnder the Tax Code of the Kyrgyz Republic, interest and capital gains on securities listed by KSE in category “A” are exempt from income tax and profit tax.",
      },
    },
    { photo: "/landing/gsb-undraw_bookmarks_r6up.svg" },
  ),
  section("gcb", 11, "buy", {
    title: { ru: "Как купить ГКВ-12 и ГКО-2?", ky: "МКВ-12 жана МКО-2ни кантип сатып алса болот?", en: "How to buy GKV-12 and GKO-2?" },
    text: {
      ru: "Купить ГКВ-12 и ГКО-2 может каждый желающий, в том числе и иностранный инвестор, через участников торгов ГЦБ. Это может быть брокерская компания или коммерческий банк по выбору клиента, с которыми заключается договор на покупку.",
      ky: "МКВ-12 жана МКО-2ни каалаган адам, анын ичинде чет элдик инвестор да МБК соодасынын катышуучулары аркылуу сатып ала алат. Бул кардардын тандоосу боюнча брокердик компания же коммерциялык банк болушу мүмкүн, алар менен сатып алууга келишим түзүлөт.",
      en: "Anyone, including foreign investors, can buy GKV-12 and GKO-2 through government securities trading participants — a brokerage company or a commercial bank of the client's choice with which a purchase agreement is signed.",
    },
  }),
  section("gcb", 12, "news", {
    title: { ru: "Актуальные новости по ГЦБ", ky: "МБК боюнча актуалдуу жаңылыктар", en: "Government securities news" },
  }),
  section("gcb", 13, "form", {
    title: { ru: "Заполните форму для покупки ГЦБ", ky: "МБК сатып алуу үчүн форманы толтуруңуз", en: "Fill in the form to buy government securities" },
    text: {
      ru: "Специалист биржи свяжется с вами и подскажет, как купить ГЦБ.",
      ky: "Биржанын адиси сиз менен байланышып, МБКны кантип сатып алууну түшүндүрөт.",
      en: "An exchange specialist will contact you and explain how to buy government securities.",
    },
  }),
];

// ── Новости по ГЦБ (в общую таблицу news с тегом «ГЦБ») ──────────────────

const gcbTag: Text = { ru: "ГЦБ", ky: "МБК", en: "Government securities" };

function gcbNews(slug: string, date: string, updatedAt: string, title: Text, excerpt: Text, body: string): CmsNews {
  return {
    id: `news-${slug}`,
    slug,
    date,
    tag: gcbTag.ru,
    kind: "exchange",
    status: "published",
    title: title.ru,
    excerpt: excerpt.ru,
    body,
    photo: "",
    issuerSlug: "",
    i18n: i18nOf({ tag: gcbTag, title, excerpt }),
    createdAt: updatedAt,
    updatedAt,
  };
}

/** Тег, по которому лендинг «Инвестиции в ГЦБ» показывает новости. */
export const gcbNewsTag = gcbTag.ru;

export const gcbNewsSeed: CmsNews[] = [
  gcbNews(
    "gcb-mega-invest-2026",
    "2026",
    "2026-06-10T00:00:00.000Z",
    {
      ru: "О выпуске государственных ценных бумаг объёмом 500 млн сомов с повышенной инвестиционной привлекательностью для населения",
      ky: "Калк үчүн инвестициялык тартымдуулугу жогорулатылган 500 млн сомдук мамлекеттик баалуу кагаздарды чыгаруу жөнүндө",
      en: "On the issue of 500 million som of government securities with higher investment appeal for the public",
    },
    {
      ru: "ГКО для населения под 17% годовых: номинал — 100 сомов, срок — два года, покупка через приложение «МегаПэй».",
      ky: "Калк үчүн жылдык 17% МКО: номиналы — 100 сом, мөөнөтү — эки жыл, «МегаПэй» тиркемеси аркылуу сатып алуу.",
      en: "GKOs for the public at 17% per annum: 100 som face value, two-year term, purchase via the MegaPay app.",
    },
    `<p>В целях обеспечения доступности рынка государственных ценных бумаг для населения, мобилизации временно свободных денежных средств, расширения инструментов внутреннего заимствования, Распоряжением Кабинета Министров Кыргызской Республики от 10.06.2026 г. №427-т осуществлён в пилотном режиме выпуск государственных казначейских облигаций (ГКО) для населения с повышенной процентной ставкой в размере 17% годовых, номинальной стоимостью одной ГКО — 100 сомов, сроком обращения — два года.</p>
<p>Погашение основной суммы — единовременного платежа производится в конце двухлетнего срока обращения, а выплата процентов — ежеквартально. Минимальный стартовый капитал для инвестирования в ГКО составляет всего 1000 сомов, максимальный объём инвестиций для одного гражданина — 10 млн сомов.</p>
<p>Для удобства граждан данный проект реализуется на электронной торговой площадке Кыргызской фондовой биржи (ЗАО «КФБ») через мобильное приложение «МегаПэй», которое является мобильным приложением государственного оператора сотовой связи «Мега» от ЗАО «Альфа Телеком».</p>
<p>Для приобретения пакета ГКО необходимо скачать и установить на свой мобильный телефон приложение «МегаПэй», пройти регистрацию/идентификацию, пополнить баланс счёта необходимой суммой, выбрать в Сервисах раздел «Мега Инвестиции», далее выбрать ГКО сроком 2 года и необходимое количество бумаг, минимально на одну тысячу сомов, и подтвердить покупку ГКО.</p>`,
  ),
  gcbNews(
    "gcb-time-to-invest",
    "2023",
    "2023-02-01T00:00:00.000Z",
    {
      ru: "Пришло время инвестировать свои деньги в выгодные государственные ценные бумаги (ГЦБ)",
      ky: "Акчаңызды пайдалуу мамлекеттик баалуу кагаздарга (МБК) салууга убакыт келди",
      en: "It is time to invest your money in profitable government securities",
    },
    {
      ru: "Почему ГЦБ выгоднее депозита: кто их выпускает, какие бывают виды и сколько можно заработать.",
      ky: "Эмне үчүн МБК депозиттен пайдалуураак: аларды ким чыгарат, кандай түрлөрү бар жана канча киреше табууга болот.",
      en: "Why government securities beat a deposit: who issues them, which types exist and how much you can earn.",
    },
    `<p>Большинство субъектов не знают, что делать со своими свободными деньгами, и традиционно вкладывают свои сбережения в депозиты банков. Однако на сегодняшний день имеются куда более привлекательные и выгодные направления: инвестиции в ГЦБ являются безрисковыми, так как их возвратность гарантируется государством.</p>
<p>В ноябре 2022 года принято распоряжение Кабинета Министров, по которому размещение и обращение государственных казначейских векселей и государственных казначейских облигаций с 2-летним сроком обращения, выпускаемых с января 2023 года, осуществляется на торговой площадке Кыргызской фондовой биржи. Решение принято в целях расширения доступности рынка государственных ценных бумаг для внутренних и внешних инвесторов.</p>
<h3>Кто выпускает государственные ценные бумаги?</h3>
<p>Эмитентом государственных ценных бумаг выступает Министерство финансов Кыргызской Республики.</p>
<h3>Виды ГЦБ</h3>
<p>В зависимости от срока обращения они делятся на краткосрочные — государственные казначейские векселя (ГКВ) и долгосрочные — государственные казначейские облигации (ГКО).</p>
<p>ГКВ — краткосрочная (12 месяцев) бездокументарная дисконтная государственная ценная бумага, номинал одной штуки — 100 сомов. ГКО — долгосрочная бездокументарная государственная ценная бумага с процентным доходом и сроком обращения свыше 1 года (в нашем случае 2 года). Номинальная стоимость ГКО и параметры выпуска определяются эмитентом в момент выпуска.</p>
<h3>Сколько можно заработать?</h3>
<p>Доходность ГКВ в среднем составляет 13,8–14% годовых. Она продаётся с дисконтом, то есть ниже номинала: дисконт определяется во время аукциона, например 86–87 сомов, а погашается по номиналу 100 сомов.</p>
<p>Полный текст — на <a href="https://www.kse.kg/ru/RussianAllNewsBlog/8510" target="_blank" rel="noreferrer">kse.kg</a>.</p>`,
  ),
  gcbNews(
    "gcb-step-by-step",
    "2023",
    "2023-01-15T00:00:00.000Z",
    {
      ru: "Инвестирование в государственные ценные бумаги (ГЦБ). Пошаговая инструкция",
      ky: "Мамлекеттик баалуу кагаздарга (МБК) инвестиция салуу. Кадам сайын нускама",
      en: "Investing in government securities: a step-by-step guide",
    },
    {
      ru: "Какие ГЦБ продаются на КФБ, как их купить через брокера или банк и сколько можно заработать.",
      ky: "КФБда кандай МБК сатылат, аларды брокер же банк аркылуу кантип сатып алса болот жана канча киреше табууга болот.",
      en: "Which government securities trade on KSE, how to buy them through a broker or bank, and how much you can earn.",
    },
    `<p>На торговой площадке Кыргызской фондовой биржи (КФБ) можно купить государственные ценные бумаги (ГЦБ) двух видов: государственные казначейские векселя сроком обращения 12 месяцев (ГКВ-12) и государственные казначейские облигации сроком обращения 2 года (ГКО-2). Эмитентом ГЦБ является Министерство финансов Кыргызской Республики. Размещение выпусков ГЦБ производится ежемесячно через аукционы, проводимые КФБ.</p>
<h3>Виды ГЦБ</h3>
<p>ГКВ — краткосрочные (12 месяцев) дисконтные государственные ценные бумаги Правительства Кыргызской Республики. Номинал одной ГКВ — 100 сомов. ГКВ выпускаются в бездокументарной форме в виде записей на счетах.</p>
<p>ГКО — долгосрочные государственные ценные бумаги Правительства Кыргызской Республики с процентным доходом (купоном) и сроком обращения свыше 1 года. Номинальная стоимость ГКО и параметры выпуска определяются эмитентом в момент выпуска. ГКО выпускаются в бездокументарной и документарной формах.</p>
<h3>Как приобрести ГЦБ?</h3>
<p>Купить ГЦБ может каждый желающий, в том числе и иностранный инвестор, через <a href="/gcb/invest#buy">участников торгов ГЦБ</a>. Это может быть брокерская компания или коммерческий банк по выбору клиента, с которыми заключается договор на покупку ГЦБ. В интересах своих клиентов брокер или банк могут покупать ГЦБ в рамках проводимого аукциона либо на вторичном рынке через торговую систему биржи. Допуск иностранных инвесторов на рынок ГЦБ не ограничен.</p>
<p>Полный текст — на <a href="https://www.kse.kg/ru/RussianAllNewsBlog/8282" target="_blank" rel="noreferrer">kse.kg</a>.</p>`,
  ),
];
