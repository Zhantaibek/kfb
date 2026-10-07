import type { CmsPartner } from "./cms";

/** Партнёры КФБ — как в разделе «Наши партнеры» на kse.kg. Начальное заполнение; дальше правятся в админке. */
export const partnersSeed: CmsPartner[] = [
  {
    "id": "partner-gfr",
    "slug": "gfr",
    "mark": "ГФР",
    "kind": "Регулятор",
    "caption": "Госфиннадзор",
    "name": "Государственная служба регулирования и надзора за финансовым рынком",
    "lead": "Регулятор финансового рынка при Министерстве экономики и коммерции Кыргызской Республики.",
    "body": "Служба задаёт требования к участникам рынка, эмитентам и организованным торгам.\n\nКФБ работает в этих правилах: допуск к торгам, раскрытие информации и надзор опираются на требования службы.",
    "site": "http://fsa.gov.kg/",
    "logo": "/partners/gfr.png",
    "logoWide": false,
    "order": 1,
    "status": "published",
    "i18n": {
      "ky": {
        "kind": "Жөнгө салуучу",
        "caption": "Финансы көзөмөлү",
        "name": "Финансы рыногун жөнгө салуу жана көзөмөлдөө мамлекеттик кызматы",
        "lead": "Кыргыз Республикасынын Экономика жана коммерция министрлигине караштуу финансы рыногунун жөнгө салуучусу.",
        "body": "Кызмат рынок катышуучуларына, эмитенттерге жана уюшкан соодага талаптарды белгилейт.\n\nКФБ ушул эрежелердин алкагында иштейт: соодага кирүү, маалыматты ачыктоо жана көзөмөл кызматтын талаптарына таянат."
      },
      "en": {
        "kind": "Regulator",
        "caption": "Market regulator",
        "name": "State service for financial market regulation and supervision",
        "lead": "Financial market regulator under the Ministry of Economy and Commerce of the Kyrgyz Republic.",
        "body": "The service sets requirements for market participants, issuers and organised trading.\n\nKSE operates under these rules: admission to trading, disclosure and supervision follow the service’s requirements."
      }
    },
    "updatedAt": "2026-10-06T00:00:00.000Z"
  },
  {
    "id": "partner-gaugi",
    "slug": "gaugi",
    "mark": "ГАУГИ",
    "kind": "Госорган",
    "caption": "Госимущество",
    "name": "Государственное агентство по управлению государственным имуществом",
    "lead": "Агентство при Кабинете Министров КР ведёт вопросы государственного имущества.",
    "body": "Агентство сопровождает решения, связанные с государственным имуществом и его выходом на рынок.\n\nДля биржи это партнёр по имущественным размещениям, когда они проходят через организованные торги.",
    "site": "https://fgi.gov.kg/",
    "logo": "/partners/gaugi.png",
    "logoWide": false,
    "order": 2,
    "status": "published",
    "i18n": {
      "ky": {
        "kind": "Мамлекеттик орган",
        "caption": "Мамлекеттик мүлк",
        "name": "Мамлекеттик мүлктү башкаруу боюнча мамлекеттик агенттик",
        "lead": "Министрлер Кабинетине караштуу агенттик мамлекеттик мүлк маселелерин жүргүзөт.",
        "body": "Агенттик мамлекеттик мүлккө жана анын рынокко чыгышына байланыштуу чечимдерди коштойт.\n\nБиржа үчүн бул өнөктөш, качан мүлктүк жайгаштыруулар уюшкан соода аркылуу өтсө."
      },
      "en": {
        "kind": "Government agency",
        "caption": "State property",
        "name": "State agency for state property management",
        "lead": "The agency under the Cabinet of Ministers handles state property.",
        "body": "The agency follows decisions on state property and its entry to the market.\n\nFor the exchange it is the partner for property offerings when they go through organised trading."
      }
    },
    "updatedAt": "2026-10-06T00:00:00.000Z"
  },
  {
    "id": "partner-mab",
    "slug": "mab",
    "mark": "МАБ",
    "kind": "Ассоциация",
    "caption": "Биржи СНГ",
    "name": "Международная ассоциация бирж стран СНГ",
    "lead": "Объединение бирж стран СНГ для обмена практикой организованного рынка.",
    "body": "Ассоциация связывает площадки региона и собирает общие подходы к торгам и инфраструктуре.\n\nКФБ входит в этот круг как биржа Кыргызстана.",
    "site": "http://mab-sng.org/",
    "logo": "/partners/mab.svg",
    "logoWide": false,
    "order": 3,
    "status": "published",
    "i18n": {
      "ky": {
        "kind": "Ассоциация",
        "caption": "КМШ биржалары",
        "name": "КМШ өлкөлөрүнүн биржаларынын эл аралык ассоциациясы",
        "lead": "Уюшкан рыноктун тажрыйбасын алмашуу үчүн КМШ биржаларынын бирикмеси.",
        "body": "Ассоциация аймактагы аянтчаларды байланыштырат жана соода менен инфраструктура боюнча жалпы ыкмаларды чогултат.\n\nКФБ бул чөйрөгө Кыргызстандын биржасы катары кирет."
      },
      "en": {
        "kind": "Association",
        "caption": "CIS exchanges",
        "name": "International Association of CIS Exchanges",
        "lead": "An association of CIS exchanges for sharing organised-market practice.",
        "body": "The association connects regional venues and gathers shared approaches to trading and infrastructure.\n\nKSE takes part as the exchange of Kyrgyzstan."
      }
    },
    "updatedAt": "2026-10-06T00:00:00.000Z"
  },
  {
    "id": "partner-nbkr",
    "slug": "nbkr",
    "mark": "НБКР",
    "kind": "Центральный банк",
    "caption": "Нацбанк",
    "name": "Национальный банк Кыргызской Республики",
    "lead": "Центральный банк страны и партнёр биржи по вопросам денежного рынка.",
    "body": "Нацбанк проводит денежно-кредитную политику и публикует показатели, на которые опирается рынок.\n\nРядом с КФБ он связан с устойчивостью финансовой системы и инфраструктурой расчётов.",
    "site": "http://www.nbkr.kg/",
    "logo": "/partners/nbkr.png",
    "logoWide": false,
    "order": 4,
    "status": "published",
    "i18n": {
      "ky": {
        "kind": "Борбордук банк",
        "caption": "Улуттук банк",
        "name": "Кыргыз Республикасынын Улуттук банкы",
        "lead": "Өлкөнүн борбордук банкы жана биржанын акча рыногу боюнча өнөктөшү.",
        "body": "Улуттук банк акча-кредит саясатын жүргүзөт жана рынок таянган көрсөткүчтөрдү жарыялайт.\n\nКФБ менен катар ал финансы системасынын туруктуулугу жана эсептешүү инфраструктурасы менен байланыштуу."
      },
      "en": {
        "kind": "Central bank",
        "caption": "National Bank",
        "name": "National Bank of the Kyrgyz Republic",
        "lead": "The country’s central bank and the exchange’s partner on money-market matters.",
        "body": "The National Bank runs monetary policy and publishes figures the market relies on.\n\nAlongside KSE it is tied to financial-system stability and settlement infrastructure."
      }
    },
    "updatedAt": "2026-10-06T00:00:00.000Z"
  },
  {
    "id": "partner-kase",
    "slug": "kase",
    "mark": "KASE",
    "kind": "Биржа-партнёр",
    "caption": "Казахстанская биржа",
    "name": "Казахстанская фондовая биржа",
    "lead": "Организатор торгов на рынке капитала Казахстана.",
    "body": "KASE — партнёрская биржа. С ней КФБ обменивается практикой листинга и устройства рынка.\n\nЭто справочная карточка. Котировки Казахстанской биржи здесь не публикуются.",
    "site": "http://www.kase.kz/",
    "logo": "/partners/kase.svg",
    "logoWide": true,
    "order": 5,
    "status": "published",
    "i18n": {
      "ky": {
        "kind": "Өнөктөш биржа",
        "caption": "Казакстан фондулук биржасы",
        "name": "Казакстан фондулук биржасы",
        "lead": "Казакстандын капитал рыногундагы сооданы уюштуруучу.",
        "body": "KASE — өнөктөш биржа. КФБ аны менен листинг жана рыноктун түзүлүшү боюнча тажрыйба алмашат.\n\nБул маалыматтык карточка. Казакстан биржасынын котировкалары бул жерде жарыяланбайт."
      },
      "en": {
        "kind": "Partner exchange",
        "caption": "Kazakhstan Stock Exchange",
        "name": "Kazakhstan Stock Exchange",
        "lead": "The organiser of trading on Kazakhstan’s capital market.",
        "body": "KASE is a partner exchange. KSE shares listing and market-structure practice with it.\n\nThis is a reference card. Kazakhstan Stock Exchange quotes are not published here."
      }
    },
    "updatedAt": "2026-10-06T00:00:00.000Z"
  },
  {
    "id": "partner-bist",
    "slug": "bist",
    "mark": "BIST",
    "kind": "Биржа-партнёр",
    "caption": "Borsa Istanbul",
    "name": "Фондовая биржа Стамбула",
    "lead": "Фондовая биржа Турции и международный партнёр КФБ.",
    "body": "Биржа Стамбула входит в круг зарубежных площадок, с которыми КФБ поддерживает профессиональные контакты.\n\nТурецкие торги отсюда не открываются: на странице только справка о партнёрстве.",
    "site": "https://borsaistanbul.com/en/",
    "logo": "/partners/bist.png",
    "logoWide": true,
    "order": 6,
    "status": "published",
    "i18n": {
      "ky": {
        "kind": "Өнөктөш биржа",
        "caption": "Borsa Istanbul",
        "name": "Стамбул фондулук биржасы",
        "lead": "Түркиянын фондулук биржасы жана КФБнын эл аралык өнөктөшү.",
        "body": "Стамбул биржасы КФБ кесиптик байланыш түзгөн чет өлкөлүк аянтчалардын катарында.\n\nТүрк соодасы бул жерден ачылбайт: бетте өнөктөштүк жөнүндө гана маалымат бар."
      },
      "en": {
        "kind": "Partner exchange",
        "caption": "Borsa Istanbul",
        "name": "Istanbul stock exchange",
        "lead": "Turkey’s stock exchange and an international partner of KSE.",
        "body": "The Istanbul exchange is among the foreign venues with which KSE keeps professional contacts.\n\nTurkish trading does not open from here: the page is only a note on the partnership."
      }
    },
    "updatedAt": "2026-10-06T00:00:00.000Z"
  },
  {
    "id": "partner-rkfr",
    "slug": "rkfr",
    "mark": "РКФР",
    "kind": "Фонд развития",
    "caption": "Фонд развития",
    "name": "Российско-Кыргызский фонд развития",
    "lead": "Фонд финансирования проектов в Кыргызской Республике.",
    "body": "Фонд поддерживает инвестиционные проекты и компании, которым может пригодиться организованный рынок.\n\nКарточка описывает роль фонда рядом с КФБ и не заменяет его собственные материалы.",
    "site": "http://rkdf.org",
    "logo": "/partners/rkfr.png",
    "logoWide": false,
    "order": 7,
    "status": "published",
    "i18n": {
      "ky": {
        "kind": "Өнүктүрүү фонду",
        "caption": "Өнүктүрүү фонду",
        "name": "Россия-Кыргыз өнүктүрүү фонду",
        "lead": "Кыргыз Республикасындагы долбоорлорду каржылоо фонду.",
        "body": "Фонд уюшкан рынок керек болушу мүмкүн болгон инвестициялык долбоорлорду жана компанияларды колдойт.\n\nКарточка фонддун КФБ жанындагы ролун сүрөттөйт жана анын өз материалдарын алмаштырбайт."
      },
      "en": {
        "kind": "Development fund",
        "caption": "Development fund",
        "name": "Russian-Kyrgyz Development Fund",
        "lead": "A fund that finances projects in the Kyrgyz Republic.",
        "body": "The fund supports investment projects and companies that may use the organised market.\n\nThe card describes the fund’s role beside KSE and does not replace the fund’s own materials."
      }
    },
    "updatedAt": "2026-10-06T00:00:00.000Z"
  },
  {
    "id": "partner-cd",
    "slug": "cd",
    "mark": "ЦД",
    "kind": "Инфраструктура",
    "caption": "Депозитарий",
    "name": "Центральный депозитарий",
    "lead": "Учёт и хранение ценных бумаг для расчётов по сделкам на бирже.",
    "body": "Депозитарий учитывает ценные бумаги. Без этого поставка по биржевой сделке не завершается.\n\nКФБ опирается на депозитарную инфраструктуру по итогам торгов.",
    "site": "http://www.cds.kg/",
    "logo": "/partners/cd.png",
    "logoWide": true,
    "order": 8,
    "status": "published",
    "i18n": {
      "ky": {
        "kind": "Инфраструктура",
        "caption": "Борбордук депозитарий",
        "name": "Борбордук депозитарий",
        "lead": "Биржадагы бүтүмдөр боюнча эсептешүү үчүн баалуу кагаздарды эсепке алуу жана сактоо.",
        "body": "Депозитарий баалуу кагаздарды эсепке алат. Ансыз биржалык бүтүм боюнча берүү аяктабайт.\n\nКФБ соода жыйынтыгы боюнча депозитардык инфраструктурага таянат."
      },
      "en": {
        "kind": "Infrastructure",
        "caption": "Central depository",
        "name": "Central depository",
        "lead": "Record-keeping and custody of securities for exchange settlement.",
        "body": "The depository records securities. Without that, delivery on an exchange trade does not finish.\n\nKSE relies on depository infrastructure after the trading session."
      }
    },
    "updatedAt": "2026-10-06T00:00:00.000Z"
  }
];
