"use client";

import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { useLocalized } from "@/lib/cms/use-localized";
import type { CmsSiteSettings } from "@/lib/cms/types";

export function ContactsIntro({ settings }: { settings: CmsSiteSettings }) {
  const loc = useLocalized(settings, ["address"]);
  return (
    <PageIntro
      crumb={
        <>
          <Link href="/">Главная</Link> / Контакты
        </>
      }
      title="Свяжитесь с нами"
      lead={loc.address || "720010, Кыргызская Республика, г. Бишкек, ул. Московская, 172."}
    />
  );
}
