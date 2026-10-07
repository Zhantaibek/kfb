"use client";

import { createContext, useContext, type ReactNode } from "react";
import { demoMarket, type MarketData } from "@/lib/market-data";

const MarketDataContext = createContext<MarketData>(demoMarket);

/** Данные рынка (живые с kse.kg или демо) для бегущей строки, подвала и блоков главной. */
export function MarketDataProvider({ value, children }: { value: MarketData; children: ReactNode }) {
  return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

export function useMarketData() {
  return useContext(MarketDataContext);
}
