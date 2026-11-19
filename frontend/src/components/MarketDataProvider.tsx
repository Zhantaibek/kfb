"use client";

import { createContext, useContext, type ReactNode } from "react";
import { emptyMarket, type MarketData } from "@/lib/market-data";

const MarketDataContext = createContext<MarketData>(emptyMarket);

/** Данные рынка (живые с kse.kg и нашей базы; нет — пустые) для бегущей строки, подвала и блоков главной. */
export function MarketDataProvider({ value, children }: { value: MarketData; children: ReactNode }) {
  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

export function useMarketData() {
  return useContext(MarketDataContext);
}
