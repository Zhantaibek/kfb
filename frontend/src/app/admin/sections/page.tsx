import { HubCardsManager } from "@/components/admin/LandingsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Карточки разделов" };

export default function Page() {
  return <HubCardsManager />;
}
