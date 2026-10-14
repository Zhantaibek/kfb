import { AppProviders } from "@/components/AppProviders";
import { MarketDataProvider } from "@/components/MarketDataProvider";
import { loadMarketData } from "@/lib/market-data";
import { SiteChrome } from "@/components/SiteChrome";
import type { Metadata } from "next";
import { Manrope, Montserrat, Unbounded } from "next/font/google";
import { htmlLang, type Lang } from "@/lib/i18n";
import { hreflang, languageAlternates, localizedPath, SITE_URL } from "@/lib/seo";
import { openGraphFor, requestLocale, siteText } from "@/lib/seo-server";
import type { ReactNode } from "react";
import "./globals.css";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const display = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
});

// Надпись «Kyrgyz Stock Exchange» на заставке при входе.
const brand = Montserrat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-brand",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { lang, path } = await requestLocale();
  const text = siteText[lang];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: text.home, template: `%s | ${text.name}` },
    description: text.description,
    applicationName: text.name,
    keywords: ["Кыргызская фондовая биржа", "КФБ", "KSE", "Kyrgyz Stock Exchange", "котировки", "ценные бумаги", "ГЦБ", "Кыргызстан", "Бишкек"],
    icons: { icon: "/brand/kse-mark.jpg", apple: "/brand/kse-mark.jpg" },
    // У каждой страницы свой canonical (раньше все страницы указывали на главную) и ссылки на языковые версии.
    alternates: { canonical: localizedPath(path, lang), languages: languageAlternates(path) },
    openGraph: openGraphFor(lang, path, text.home, text.description),
    twitter: { card: "summary_large_image", title: text.home, description: text.description },
    formatDetection: { telephone: false },
  };
}

/** Сведения о бирже и поиск по сайту для Google — на всех страницах. */
function siteSchema(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: siteText.ru.name,
        alternateName: [siteText.en.name, siteText.ky.name, "KSE", "КФБ"],
        url: SITE_URL,
        logo: `${SITE_URL}/brand/kse-mark.jpg`,
        foundingDate: "1994",
        address: { "@type": "PostalAddress", addressLocality: "Бишкек", addressCountry: "KG" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: siteText[lang].name,
        inLanguage: hreflang[lang],
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}${localizedPath("/search", lang)}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

// Тема по умолчанию — системная; выбор пользователя (kse-theme) важнее.
const themeScript = `try{var t=localStorage.getItem("kse-theme");if(t!=="dark"&&t!=="light"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Живые данные kse.kg для бегущей строки, подвала и главной (или демо, если их ещё нет).
  const [market, { lang }] = await Promise.all([loadMarketData(), requestLocale()]);
  return (
    <html
      lang={htmlLang(lang)}
      className={`${sans.variable} ${display.variable} ${brand.variable}`}
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema(lang)) }} />
        <AppProviders initialLang={lang}>
          <MarketDataProvider value={market}>
            <SiteChrome>{children}</SiteChrome>
          </MarketDataProvider>
        </AppProviders>
      </body>
    </html>
  );
}