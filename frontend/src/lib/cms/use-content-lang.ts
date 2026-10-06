"use client";

import { useCallback, useState } from "react";
import type { ContentLang } from "@/lib/cms/locale";

/**
 * Язык вкладки в форме админки. Открыли другую запись (сменился key) — снова русский.
 * Язык вычисляется из key, а не сбрасывается эффектом, поэтому лишнего перерендера нет.
 */
export function useContentLang(key: unknown) {
  const [state, setState] = useState<{ key: unknown; lang: ContentLang }>({ key, lang: "ru" });
  const lang: ContentLang = Object.is(state.key, key) ? state.lang : "ru";
  const setLang = useCallback((next: ContentLang) => setState({ key, lang: next }), [key]);
  return [lang, setLang] as const;
}
