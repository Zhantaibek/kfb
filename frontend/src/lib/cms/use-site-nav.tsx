"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { siteFooterButtons, siteFooterColumns, siteFooterLinks, siteNav, sitePrimaryNav, type SiteLink, type SiteNavGroup } from "@/data/site-nav";
import { applyLocale } from "@/lib/cms/locale";
import { EDU_URL, eduHref } from "@/lib/edu";
import { menuGroupLinks, menuToFooterColumns, menuToFooterNav, menuToPrimaryNav, menuToSiteNav } from "@/lib/cms/menu-tree";
import type { CmsHomeHub, CmsMenuItem, CmsPartner, CmsSiteSettings } from "@/lib/cms/types";
import { partnerFields, partnersOrFallback } from "@/lib/cms/partners";
import { useLang } from "@/lib/use-tr";

/** Бывшие разделы учебного центра на сайте: теперь вели бы на один и тот же адрес, поэтому не показываем. */
const LEGACY_EDU_ITEMS = new Set(["menu-edu-plan", "menu-edu-online"]);

const emptySettings: CmsSiteSettings = {
  id: "site",
  tagline: "Рынок ценных бумаг Кыргызстана. Котировки, итоги торгов и отчёты эмитентов — в одном месте.",
  address: "г. Бишкек, ул. Московская, 172",
  phones: "+996 312 31 14 84\n+996 551 31 14 84",
  emails: "office@kse.kg",
  fax: "+996 312 31 14 83",
  facebookUrl: "https://ru-ru.facebook.com/KyrgyzStockExchange/",
  instagramUrl: "https://www.instagram.com/kse.kg/",
  telegramUrl: "https://t.me/kse_publicinfo",
  license: "№37 НКРЦБ от 30.11.2000",
  copyright: "© 2004–2026 ЗАО «Кыргызская фондовая биржа»",
  eduUrl: EDU_URL,
  disclosurePhone: "(0312) 45-40-53",
  eduPhone: "+996 (772) 63-79-97",
  i18n: {},
  updatedAt: "",
};

type SiteNavValue = {
  nav: SiteNavGroup[];
  /** Строка навигации шапки (группа меню «primary»). */
  primary: SiteLink[];
  footer: typeof siteFooterColumns;
  /** Кнопки баннера футера (группа «footer-buttons»). */
  footerButtons: SiteLink[];
  /** Ссылки с иконкой документа в футере (группа «footer-links»). */
  footerLinks: SiteLink[];
  settings: CmsSiteSettings;
  hubs: CmsHomeHub[];
  /** Партнёры из админки (до загрузки — прежний список из кода). */
  partners: CmsPartner[];
};

const SiteNavContext = createContext<SiteNavValue | null>(null);

export function SiteNavProvider({ children }: { children: ReactNode }) {
  const value = useSiteNavState();
  return <SiteNavContext.Provider value={value}>{children}</SiteNavContext.Provider>;
}

export function useSiteNav() {
  const ctx = useContext(SiteNavContext);
  if (!ctx) throw new Error("useSiteNav must be used within SiteNavProvider");
  return ctx;
}

function useSiteNavState(): SiteNavValue {
  const lang = useLang();
  const [menu, setMenu] = useState<CmsMenuItem[]>([]);
  const [settingsRaw, setSettingsRaw] = useState<CmsSiteSettings>(emptySettings);
  const [hubsRaw, setHubsRaw] = useState<CmsHomeHub[]>([]);
  const [partnersRaw, setPartnersRaw] = useState<CmsPartner[]>([]);

  useEffect(() => {
    void fetch("/api/public/content")
      .then((response) => response.json())
      .then((data: { menu?: CmsMenuItem[]; settings?: CmsSiteSettings; hubs?: CmsHomeHub[]; partners?: CmsPartner[] }) => {
        if (data.menu?.length) setMenu(data.menu);
        if (data.settings) setSettingsRaw(data.settings);
        if (data.hubs?.length) setHubsRaw(data.hubs);
        if (data.partners?.length) setPartnersRaw(data.partners);
      })
      .catch(() => undefined);
  }, []);

  return useMemo(() => {
    // Учебный центр — отдельный проект: его старые адреса в меню ведут на его собственный адрес.
    const localizedMenu = menu
      .filter((item) => !LEGACY_EDU_ITEMS.has(item.id))
      .map((item) => ({ ...applyLocale(item, lang, ["label"]), href: eduHref(item.href) }));
    const tree = menuToSiteNav(localizedMenu);
    // Свои колонки футера из админки; пока их нет — первые группы бургер-меню, как раньше.
    const ownFooter = menuToFooterNav(localizedMenu);
    const footer = ownFooter.length ? ownFooter : menuToFooterColumns(localizedMenu);
    // Пустую группу из админки уважаем (кнопки убраны), запасной набор — только пока меню не загрузилось.
    const footerButtons = menu.length ? menuGroupLinks(localizedMenu, "footer-buttons") : siteFooterButtons;
    const footerLinks = menu.length ? menuGroupLinks(localizedMenu, "footer-links") : siteFooterLinks;
    const primary = menuToPrimaryNav(localizedMenu);
    return {
      nav: tree.length ? tree : siteNav,
      primary: primary.length ? primary : sitePrimaryNav,
      footer: footer.length ? footer : siteFooterColumns,
      footerButtons,
      footerLinks,
      settings: applyLocale(settingsRaw, lang, ["tagline", "address", "license", "copyright"]),
      hubs: hubsRaw.map((item) => ({ ...applyLocale(item, lang, ["title", "text"]), href: eduHref(item.href) })),
      partners: partnersOrFallback(partnersRaw).map((item) => applyLocale(item, lang, [...partnerFields])),
    };
  }, [lang, menu, settingsRaw, hubsRaw, partnersRaw]);
}
