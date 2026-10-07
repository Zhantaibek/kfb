import { GcbLandingManager } from "@/components/admin/LandingsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Инвестиции в ГЦБ" };

export default function Page() {
  return <GcbLandingManager />;
}
