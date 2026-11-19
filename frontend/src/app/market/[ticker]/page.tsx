import { redirect } from "next/navigation";
import { instrumentHref } from "@/lib/market-data";

/** Старые ссылки /market/<тикер> — ведут на котировки с поиском по тикеру (демо-карточек бумаг больше нет). */
export default async function InstrumentPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  redirect(instrumentHref({ live: true }, ticker));
}
