import { NextResponse, type NextRequest } from "next/server";
import { isLang, LANG_COOKIE, LANG_HEADER, PATH_HEADER, splitLangPath } from "@/lib/seo";

/**
 * Языковые адреса: /ky/... и /en/... показывают те же страницы на кыргызском и английском.
 * Префикс снимается (rewrite), а язык передаётся серверу заголовком — страница сразу отрисовывается
 * на нужном языке, и поисковики индексируют каждую языковую версию отдельно.
 * Без префикса язык берётся из cookie (выбор посетителя), иначе — русский.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { lang: urlLang, path } = splitLangPath(pathname);
  const cookieLang = request.cookies.get(LANG_COOKIE)?.value;
  const lang = urlLang ?? (isLang(cookieLang) ? cookieLang : "ru");

  const headers = new Headers(request.headers);
  headers.set(LANG_HEADER, lang);
  headers.set(PATH_HEADER, pathname);

  if (!urlLang) return NextResponse.next({ request: { headers } });

  // Старые адреса kse.kg писались с большой буквы (/en/FinMarket) — ведём на раздел в нижнем регистре.
  const [, first = "", ...rest] = path.split("/");
  if (first !== first.toLowerCase()) {
    const lower = request.nextUrl.clone();
    lower.pathname = `/${urlLang}/${[first.toLowerCase(), ...rest].join("/")}`;
    return NextResponse.redirect(lower, 301);
  }

  const target = request.nextUrl.clone();
  target.pathname = path;
  target.search = search;
  const response = NextResponse.rewrite(target, { request: { headers } });
  // Пришли по ссылке /ky/... — дальше по сайту тоже кыргызский.
  if (cookieLang !== urlLang) {
    response.cookies.set(LANG_COOKIE, urlLang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Только страницы: без API, админки, статики, загрузок и служебных файлов (sitemap, robots, картинки).
  matcher: ["/((?!api|admin|_next|uploads|brand|openapi\\.json|sitemap\\.xml|robots\\.txt|opengraph-image|favicon\\.ico|icon\\.png|.*\\.[a-zA-Z0-9]+$).*)"],
};
