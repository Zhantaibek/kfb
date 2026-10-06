"use client";

import { contentLanguages, hasLocale, type ContentLang } from "@/lib/cms/locale";
import type { CmsI18n } from "@/lib/cms/types";
import css from "@/app/admin/admin.module.css";

export function LocaleTabs({
  lang,
  onChange,
  i18n,
  fields,
  item,
}: {
  lang: ContentLang;
  onChange: (lang: ContentLang) => void;
  i18n?: CmsI18n;
  fields: string[];
  item?: object | null;
}) {
  return (
    <div className={css.localeBar}>
      <div className={css.localeTabs} role="tablist" aria-label="Язык текста">
        {contentLanguages.map((entry) => (
          <button
            key={entry.id}
            className={css.localeTab}
            type="button"
            role="tab"
            data-on={lang === entry.id ? "true" : undefined}
            onClick={() => onChange(entry.id)}
          >
            {entry.short}
            {entry.id === "ru" ? null : (
              <i data-on={hasLocale(i18n, entry.id, fields, item) ? "true" : undefined} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
      <p className={css.localeHint}>
        {lang === "ru"
          ? "Русский — кириллица, кыргызский — кыргызская кириллица, английский — латиница. Копировать один текст на все вкладки нельзя."
          : lang === "ky"
            ? "Пишите по-кыргызски кириллицей. Русский текст сюда не подходит."
            : "Write in English using the Latin alphabet. Cyrillic is not allowed here."}
      </p>
    </div>
  );
}

export function LocaleDots({
  i18n,
  fields,
  item,
}: {
  i18n?: CmsI18n;
  fields: string[];
  item?: object;
}) {
  return (
    <span className={css.localeDots} title="Переводы KY / EN">
      <span data-on={hasLocale(i18n, "ky", fields, item) ? "true" : undefined}>KY</span>
      <span data-on={hasLocale(i18n, "en", fields, item) ? "true" : undefined}>EN</span>
    </span>
  );
}
