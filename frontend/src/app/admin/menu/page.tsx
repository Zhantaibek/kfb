import Link from "next/link";
import type { Metadata } from "next";
import { HubsManager } from "@/components/admin/HubsManager";
import { HubCardsManager } from "@/components/admin/LandingsManager";
import { MenuManager } from "@/components/admin/MenuManager";
import css from "@/app/admin/admin.module.css";

export const metadata: Metadata = { title: "Меню и страницы" };

/** Один раздел админки вместо трёх: меню и тексты страниц, блоки главной, карточки разделов. */
const tabs = [
  { id: "menu", label: "Меню и страницы" },
  { id: "home", label: "Главная" },
  { id: "cards", label: "Карточки разделов" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default async function AdminMenuPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requested } = await searchParams;
  const tab: Tab = tabs.some((item) => item.id === requested) ? (requested as Tab) : "menu";

  return (
    <>
      <nav className={css.localeTabs} aria-label="Части раздела" style={{ marginBottom: 18 }}>
        {tabs.map((item) => (
          <Link
            key={item.id}
            className={css.localeTab}
            href={item.id === "menu" ? "/admin/menu" : `/admin/menu?tab=${item.id}`}
            data-on={item.id === tab}
            aria-current={item.id === tab ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "home" ? <HubsManager /> : tab === "cards" ? <HubCardsManager /> : <MenuManager />}
    </>
  );
}
