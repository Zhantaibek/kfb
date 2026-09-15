import { SliderManager } from "@/components/admin/SliderManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Слайдер" };

export default function AdminSliderPage() {
  return <SliderManager />;
}
