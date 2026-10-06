import type { Metadata } from "next";
import { ResourceDirectory } from "@/components/ResourcePages";

export const metadata: Metadata = { title: "Наши партнеры" };

export default function Page() {
  return <ResourceDirectory />;
}
