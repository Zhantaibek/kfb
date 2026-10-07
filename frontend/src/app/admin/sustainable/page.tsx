import { SustainableManager } from "@/components/admin/LandingsManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Устойчивое развитие" };

export default function Page() {
  return <SustainableManager />;
}
