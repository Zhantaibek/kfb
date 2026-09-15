"use client";

import { useApp } from "@/components/AppProviders";
import { languages } from "@/lib/i18n";
import css from "@/app/admin/admin.module.css";

export function AdminLangSwitch() {
  const { lang, setLang } = useApp();
  return (
    <div className={css.langSwitch} role="group" aria-label="Язык панели">
      {languages.map((item) => (
        <button
          key={item.id}
          type="button"
          data-on={item.id === lang ? "true" : undefined}
          title={item.label}
          onClick={() => setLang(item.id)}
        >
          {item.id.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
