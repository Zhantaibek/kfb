"use client";

import { CollectionManager, type FieldSpec } from "@/components/admin/CollectionManager";
import { PrimaryNavManager } from "@/components/admin/PrimaryNavManager";
import { useAdminStore } from "@/lib/cms/client";
import type { CmsLandingSection, LandingPage } from "@/lib/cms/types";
import css from "@/app/admin/admin.module.css";

const status = { status: "published" };

/** Названия блоков для таблицы «Тексты страницы». */
const sectionNames: Record<string, string> = {
  hero: "Первый экран",
  about: "О секторе",
  rules: "Требования к инструментам",
  directions: "Направления — заголовок",
  bonds: "Перечень ценных бумаг — заголовок",
  verifiers: "Организации — заголовок и картинка",
  guide: "Руководство ESG",
  reports: "ESG-отчёты — заголовок и обложка",
  features: "Зачем государство выпускает ГКВ и ГКО",
  earn: "Как на этом можно заработать",
  listing: "Листинг на КФБ",
  buy: "Как купить — текст над брокерами и банками",
  news: "Новости — заголовок",
  form: "Форма покупки",
};

function sectionName(item: Record<string, unknown>) {
  const key = String(item.key ?? "");
  const direction = key.match(/^direction-(\d+)$/);
  if (direction) return `Направление ${direction[1]}`;
  const feature = key.match(/^feature-(\d+)$/);
  if (feature) return `Преимущество ${feature[1]}`;
  return sectionNames[key] ?? key;
}

const sectionFields: FieldSpec[] = [
  { name: "kicker", label: "Надпись над заголовком", i18n: true },
  { name: "title", label: "Заголовок", i18n: true, wide: true },
  { name: "text", label: "Текст (абзацы — через пустую строку)", kind: "textarea", i18n: true, rows: 6 },
  { name: "items", label: "Пункты списка (по одному в строке)", kind: "lines", i18n: true },
  { name: "link", label: "Ссылка кнопки (например, PDF)", wide: true },
  { name: "photo", label: "Картинка", kind: "image" },
];

function SectionsManager({ admin, sections, page, href }: { admin: Parameters<typeof CollectionManager>[0]["admin"]; sections: CmsLandingSection[]; page: LandingPage; href: string }) {
  return (
    <CollectionManager
      admin={admin}
      collection="landingSections"
      title="Тексты страницы"
      note="Каждый блок страницы — отдельная запись. Пустое поле на сайте не показывается."
      items={sections.filter((item) => item.page === page)}
      fields={sectionFields}
      row={(item) => ({ title: sectionName(item), meta: String(item.title || item.text || "").slice(0, 120), href: `${href}#${String(item.key)}` })}
    />
  );
}

/** «Сектор устойчивого развития» (/sustainable): тексты, бумаги, верификаторы, ESG-отчёты. */
export function SustainableManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const admin = { busy, mutate, upload, setError };
  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Устойчивое развитие</h1>
      <p className={css.lead}>
        Страница «Сектор устойчивого развития»: тексты блоков, перечень бумаг сектора, организации-верификаторы и ESG-отчёты. Всё на трёх
        языках, порядок меняется стрелками.
      </p>
      {error ? <p className={css.error}>{error}</p> : null}
      <SectionsManager admin={admin} sections={store?.landingSections ?? []} page="sustainable" href="/sustainable" />
      <CollectionManager
        admin={admin}
        collection="sustainableBonds"
        title="Перечень ценных бумаг сектора"
        note="Зелёные, социальные облигации и облигации устойчивого развития. Эмитент — slug из «Эмитенты и листинг»: даёт ссылку «Профиль в ЦРИ КФБ»."
        items={store?.sustainableBonds ?? []}
        blank={{ ...status, name: "", issuerSlug: "", regNumber: "", kind: "", volume: "", nominal: "", currency: "сом", yieldRate: "", startDate: "", endDate: "", category: "", standard: "" }}
        addLabel="+ Бумага"
        properNames={["name"]}
        fields={[
          { name: "name", label: "Выпуск", i18n: true, required: true, wide: true, placeholder: "ЗАО Банк Азии (1-выпуск)" },
          {
            name: "issuerSlug",
            label: "Эмитент в ЦРИ",
            kind: "select",
            options: [["", "— без ссылки —"], ...(store?.issuers ?? []).map((item) => [item.slug, item.name] as [string, string])],
          },
          { name: "regNumber", label: "Регистрационный номер ЦБ", placeholder: "KG0201105119" },
          { name: "kind", label: "Описание ценной бумаги", i18n: true, placeholder: "зелёная облигация" },
          { name: "volume", label: "Объём выпуска (шт.)" },
          { name: "nominal", label: "Номинал" },
          { name: "currency", label: "Валюта номинала" },
          { name: "yieldRate", label: "Доходность", i18n: true, placeholder: "12% годовых" },
          { name: "startDate", label: "Дата начала размещения", placeholder: "18.11.2022" },
          { name: "endDate", label: "Дата погашения", placeholder: "18.11.2025" },
          { name: "category", label: "Категория листинга" },
          { name: "standard", label: "Соответствие стандартам", i18n: true, kind: "textarea", rows: 2 },
        ]}
        row={(item) => ({ title: String(item.name), meta: [item.regNumber, item.kind, item.yieldRate].filter(Boolean).join(" · ") })}
      />
      <CollectionManager
        admin={admin}
        collection="verifiers"
        title="Организации для независимой оценки"
        items={store?.verifiers ?? []}
        blank={{ ...status, name: "", site: "" }}
        addLabel="+ Организация"
        properNames={["name"]}
        fields={[
          { name: "name", label: "Название", i18n: true, required: true, wide: true },
          { name: "site", label: "Сайт", placeholder: "https://…", wide: true },
        ]}
        row={(item) => ({ title: String(item.name), meta: String(item.site ?? ""), href: String(item.site || "") || undefined })}
      />
      <CollectionManager
        admin={admin}
        collection="esgReports"
        title="ESG-отчёты"
        note="PDF загружается с компьютера (или укажите ссылку на файл)."
        items={store?.esgReports ?? []}
        blank={{ ...status, title: "", file: "" }}
        addLabel="+ Отчёт"
        fields={[
          { name: "title", label: "Название", i18n: true, required: true, wide: true, placeholder: "ЗАО Банк Азии — Отчёт об устойчивом развитии 2025" },
          { name: "file", label: "Файл отчёта", kind: "file" },
        ]}
        row={(item) => ({ title: String(item.title), meta: item.file ? "Файл загружен" : "Файл не загружен", href: String(item.file || "") || undefined })}
      />
    </>
  );
}

/** «Инвестиции в ГЦБ» (/gcb/invest): тексты блоков и участники торгов ГЦБ. */
export function GcbLandingManager() {
  const { store, error, busy, mutate, upload, setError } = useAdminStore();
  const admin = { busy, mutate, upload, setError };
  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Инвестиции в ГЦБ</h1>
      <p className={css.lead}>
        Страница «Инвестиции в ГЦБ»: тексты блоков и брокеры и банки — участники торгов ГЦБ. Новости на странице — из раздела «Новости» с
        тегом «ГЦБ»; заявки с формы покупки приходят в «Заявки».
      </p>
      {error ? <p className={css.error}>{error}</p> : null}
      <SectionsManager admin={admin} sections={store?.landingSections ?? []} page="gcb" href="/gcb/invest" />
      <CollectionManager
        admin={admin}
        collection="gcbParticipants"
        title="Брокеры и банки"
        note="Вкладки «Брокеры / Банки» в блоке «Как купить ГКВ-12 и ГКО-2?». Телефоны и e-mail — по одному в строке."
        items={store?.gcbParticipants ?? []}
        blank={{ ...status, title: "", type: "broker", address: "", phones: "", emails: "", website: "" }}
        addLabel="+ Участник"
        properNames={["title"]}
        fields={[
          { name: "title", label: "Название", i18n: true, required: true, wide: true },
          {
            name: "type",
            label: "Вкладка",
            kind: "select",
            options: [
              ["broker", "Брокеры"],
              ["bank", "Банки"],
            ],
          },
          { name: "website", label: "Сайт", placeholder: "https://…" },
          { name: "address", label: "Адрес", wide: true },
          { name: "phones", label: "Телефоны", kind: "lines", rows: 3 },
          { name: "emails", label: "E-mail", kind: "lines", rows: 2 },
        ]}
        row={(item) => ({ title: String(item.title), meta: `${item.type === "bank" ? "Банк" : "Брокер"} · ${String(item.phones ?? "").split("\n")[0]}` })}
      />
    </>
  );
}

/** Карточки разделов «О Бирже» и «Статистика торгов» (как на kse.kg/ru/GeneralInfo и /ru/Statistics). */
export function HubCardsManager() {
  const { store, error, busy, mutate, setError } = useAdminStore();
  const menu = store?.menu ?? [];
  const shared = { busy, mutate, setError };
  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Карточки разделов</h1>
      <p className={css.lead}>Карточки-ссылки на страницах «О Бирже» (/about) и «Статистика торгов» (/statistics). Каждый пункт сохраняется сразу.</p>
      {error ? <p className={css.error}>{error}</p> : null}
      <PrimaryNavManager
        {...shared}
        items={menu.filter((item) => item.group === "hub-about")}
        group="hub-about"
        title="О Бирже"
        note="Карточки на странице /about."
        addLabel="+ карточка"
        emptyText="Карточек нет — раздел пустой."
        removeText={(item) => `Убрать карточку «${item.label}»? Сама страница останется.`}
      />
      <PrimaryNavManager
        {...shared}
        items={menu.filter((item) => item.group === "hub-statistics")}
        group="hub-statistics"
        title="Статистика торгов"
        note="Карточки на странице /statistics."
        addLabel="+ карточка"
        emptyText="Карточек нет — раздел пустой."
        removeText={(item) => `Убрать карточку «${item.label}»? Сама страница останется.`}
      />
    </>
  );
}
