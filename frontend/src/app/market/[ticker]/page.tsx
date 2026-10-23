import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageIntro } from "@/components/Forms";
import { formatChange, formatSom, getInstrument, instruments, typeLabel } from "@/data/catalog";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";
import { instrumentHref, loadMarketData } from "@/lib/market-data";

export function generateStaticParams() {
  return instruments.map((item) => ({ ticker: item.ticker }));
}

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params;
  const item = getInstrument(ticker);
  return { title: item ? `${item.ticker} — ${item.name}` : "Инструмент" };
}

export default async function InstrumentPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  // Карточка бумаги — из демо-каталога (цена и изменение условные). Когда есть живые данные kse.kg,
  // ведём на настоящие котировки, чтобы не выдавать демо-цифры за биржевые.
  const market = await loadMarketData();
  if (market.live) redirect(instrumentHref(market, ticker));
  const item = getInstrument(ticker);
  if (!item) notFound();

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / <Link href="/market">Торги</Link> / {item.ticker}
          </>
        }
        title={`${item.ticker} · ${item.name}`}
        lead={item.issuer}
      />
      <div className={ui.grid}>
        <article className={ui.card}>
          <h2>{formatSom(item.price)} сом</h2>
          <p className={item.change < 0 ? ui.down : ui.up}>{formatChange(item.change)}</p>
          <p>Объём {formatSom(item.volume)} · листинг {item.listing} · {typeLabel[item.type]}</p>
        </article>
        <article className={ui.card}>
          <h2>Об инструменте</h2>
          <p>{item.description}</p>
          <p>Сделки заключаются через участников торгов КФБ в торговую сессию 09:00–17:00.</p>
        </article>
      </div>
    </PublicMain>
  );
}
