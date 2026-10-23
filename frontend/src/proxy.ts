import { NextResponse, type NextRequest } from "next/server";

/**
 * Передаёт путь страницы в заголовке x-pathname: корневой layout строит по нему canonical и og:url.
 * Без этого metadata из layout наследовалась всеми страницами и каждая объявляла своим адресом главную.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Только страницы: без API, статики Next, загрузок и файлов из public.
  matcher: ["/((?!api|_next/static|_next/image|uploads|favicon.ico|icon.png|robots.txt|sitemap.xml|.*\\.[a-z0-9]+$).*)"],
};
