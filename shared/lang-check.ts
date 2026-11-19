export type CheckLang = "ru" | "ky" | "en";

function plainText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, " ")
    .replace(/\+?\d[\d\s()-]{5,}/g, " ")
    .replace(/[0-9№#]+/g, " ")
    .replace(/[«»""„“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countScripts(text: string) {
  let latin = 0;
  let cyr = 0;
  let kyExtra = 0;
  for (const ch of text) {
    if (/[A-Za-z]/.test(ch)) latin += 1;
    else if (/[А-Яа-яЁёҢңӨөҮүІі]/.test(ch)) {
      cyr += 1;
      if (/[ҢңӨөҮү]/.test(ch)) kyExtra += 1;
    }
  }
  return { latin, cyr, kyExtra, letters: latin + cyr };
}

function sameText(a: string, b: string) {
  return a.toLowerCase().replace(/\s+/g, " ") === b.toLowerCase().replace(/\s+/g, " ");
}

export function languageError(text: string, lang: CheckLang, ruText = ""): string | null {
  const plain = plainText(text);
  const stats = countScripts(plain);
  if (stats.letters < 3) return null;

  if (lang === "en") {
    if (stats.cyr / stats.letters > 0.25) {
      return "Вкладка EN: текст должен быть на английском — латиницей, без кириллицы.";
    }
    if (stats.latin / stats.letters < 0.6) {
      return "Вкладка EN: напишите текст по-английски.";
    }
    if (ruText && sameText(plain, plainText(ruText))) {
      return "Вкладка EN: это не английский перевод.";
    }
    return null;
  }

  if (lang === "ru") {
    if (stats.latin / stats.letters > 0.45 && stats.cyr / stats.letters < 0.5) {
      return "Вкладка RU: текст должен быть на русском — кириллицей.";
    }
    if (stats.cyr / stats.letters < 0.55) {
      return "Вкладка RU: используйте русскую кириллицу.";
    }
    return null;
  }

  // Кыргызский текст не проверяем: его пишут и кириллицей, и латиницей, а названия, тикеры и имена
  // часто совпадают с русскими. Достаточно, что вкладка KY заполнена (это проверяет вызывающий код).
  return null;
}
