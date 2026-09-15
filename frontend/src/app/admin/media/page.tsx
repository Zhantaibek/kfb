import { MediaManager } from "@/components/admin/MediaManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Медиа" };

export default function AdminMediaPage() {
  return <MediaManager />;
}
