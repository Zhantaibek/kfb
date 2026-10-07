import { AppProviders } from "@/components/AppProviders";
import { MarketDataProvider } from "@/components/MarketDataProvider";
import { loadMarketData } from "@/lib/market-data";
import { SiteChrome } from "@/components/SiteChrome";
import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://kse.kg"),
  title: {
    default: "Кыргызская фондовая биржа — финансовый рынок Кыргызстана",
    template: "%s | Кыргызская фондовая биржа",
  },
  description:
    "Официальный портал Кыргызской фондовой биржи: котировки, итоги торгов, листинг, раскрытие информации и инвестиции в ГЦБ.",
  keywords: [
    "Кыргызская фондовая биржа",
    "КФБ",
    "KSE",
    "котировки",
    "ценные бумаги",
    "ГЦБ",
    "Кыргызстан",
  ],
  icons: {
    icon: "/brand/kse-mark.jpg",
    apple: "/brand/kse-mark.jpg",
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_KG",
    url: "/",
    siteName: "Кыргызская фондовая биржа",
    title: "Кыргызская фондовая биржа",
    description:
      "Финансовый рынок Кыргызстана — котировки, листинг и раскрытие информации.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Кыргызская фондовая биржа",
    description: "Котировки, листинг и раскрытие информации.",
  },
};

const themeScript = `try{var t=localStorage.getItem("kse-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}else{document.documentElement.setAttribute("data-theme","dark")}}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Живые данные kse.kg для бегущей строки, подвала и главной (или демо, если их ещё нет).
  const market = await loadMarketData();
  return (
    <html
      lang="ru"
      className={`${sans.variable} ${display.variable}`}
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AppProviders>
          <MarketDataProvider value={market}>
            <SiteChrome>{children}</SiteChrome>
          </MarketDataProvider>
        </AppProviders>
      </body>
    </html>
  );
}