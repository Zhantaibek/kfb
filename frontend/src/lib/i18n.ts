import { phrases } from "@/lib/i18n-phrases";

export type Lang = "ru" | "ky" | "en";

export const languages: { id: Lang; label: string }[] = [
  { id: "ky", label: "Кыргызча" },
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
];

const dict = {
  ru: {
    cabinet: "Кабинет",
    login: "Войти",
    logout: "Выйти",
    menu: "Меню",
    search: "Поиск",
  },
  ky: {
    cabinet: "Кабинет",
    login: "Кирүү",
    logout: "Чыгуу",
    menu: "Меню",
    search: "Издөө",
  },
  en: {
    cabinet: "Account",
    login: "Sign in",
    logout: "Sign out",
    menu: "Menu",
    search: "Search",
  },
} as const;

export type DictKey = keyof typeof dict.ru;

export function t(lang: Lang, key: DictKey) {
  return dict[lang][key];
}

export function htmlLang(lang: Lang) {
  return lang === "ky" ? "ky" : lang;
}

function skipTranslate(text: string) {
  const value = text.trim();
  if (!value) return true;
  if (/^[\d+\s.,%−–—:/\-]+$/.test(value)) return true;
  if (/@/.test(value) || /^https?:/i.test(value) || /^\+?\d[\d\s()-]{6,}$/.test(value)) return true;
  if (/^[A-Z0-9.]{2,8}$/.test(value)) return true;
  return false;
}

type Template = { ru: string; re: RegExp; names: string[] };

let templates: Template[] | null = null;

function getTemplates() {
  if (templates) return templates;
  templates = Object.keys(phrases.en)
    .filter((key) => key.includes("{"))
    .sort((a, b) => b.length - a.length)
    .map((ru) => {
      const names: string[] = [];
      const pattern = ru.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{(\w+)\\\}/g, (_match, name: string) => {
        names.push(name);
        return "(.+?)";
      });
      return { ru, re: new RegExp(`^${pattern}$`), names };
    });
  return templates;
}

function applyTemplate(lang: Lang, text: string) {
  const table = phrases[lang] as Record<string, string>;
  for (const item of getTemplates()) {
    const match = text.match(item.re);
    if (!match) continue;
    let out = table[item.ru] ?? item.ru;
    item.names.forEach((name, index) => {
      out = out.replaceAll(`{${name}}`, match[index + 1] ?? "");
    });
    return out;
  }
  return null;
}

export function tr(lang: Lang, text: string): string {
  if (!text || lang === "ru") return text;
  if (skipTranslate(text)) return text;
  const table = phrases[lang] as Record<string, string>;
  const exact = table[text] ?? table[text.trim()];
  if (exact) return exact;

  const templated = applyTemplate(lang, text.trim());
  if (templated) return templated;

  if (text.includes(" / ")) {
    return text
      .split(" / ")
      .map((part) => tr(lang, part))
      .join(" / ");
  }
  if (text.includes(" · ")) {
    return text
      .split(" · ")
      .map((part) => tr(lang, part))
      .join(" · ");
  }

  const prefix = text.match(/^(Бишкек)(\s+)(.+)$/);
  if (prefix) return `${tr(lang, prefix[1])}${prefix[2]}${prefix[3]}`;

  return text;
}

export function trf(lang: Lang, template: string, vars: Record<string, string | number>) {
  let out = tr(lang, template);
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}

export function translateHtml(lang: Lang, html: string) {
  if (lang === "ru" || !html) return html;
  return html.replace(/>([^<]+)</g, (_match, text: string) => `>${tr(lang, text)}<`);
}
