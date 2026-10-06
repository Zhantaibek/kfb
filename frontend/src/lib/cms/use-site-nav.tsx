"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { siteFooterButtons, siteFooterColumns, siteFooterLinks, siteNav, sitePrimaryNav, type SiteLink, type SiteNavGroup } from "@/data/site-nav";
import { applyLocale } from "@/lib/cms/locale";
import { menuGroupLinks, menuToFooterColumns, menuToFooterNav, menuToPrimaryNav, menuToSiteNav } from "@/lib/cms/menu-tree";
import type { CmsHomeHub, CmsMenuItem, CmsSiteSettings } from "@/lib/cms/types";
import { useLang } from "@/lib/use-tr";

const emptySettings: CmsSiteSettings = {
  id: "site",
  tagline: "Рынок ценных бумаг Кыргызстана. Котировки, итоги торгов и отчёты эмитентов — в одном месте.",
  address: "г. Бишкек, ул. Московская, 172",
  phones: "+996 312 31 14 84\n+996 551 31 14 84",
  emails: "office@kse.kg",
  fax: "+996 312 31 14 83",
  license: "№37 НКРЦБ от 30.11.2000",
  copyright: "© 2004–2026 ЗАО «Кыргызская фондовая биржа»",
  eduUrl: "http://127.0.0.1:5173/education/app/",
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

  useEffect(() => {
    void fetch("/api/public/content")
      .then((response) => response.json())
      .then((data: { menu?: CmsMenuItem[]; settings?: CmsSiteSettings; hubs?: CmsHomeHub[] }) => {
        if (data.menu?.length) setMenu(data.menu);
        if (data.settings) setSettingsRaw(data.settings);
        if (data.hubs?.length) setHubsRaw(data.hubs);
      })
      .catch(() => undefined);
  }, []);

  return useMemo(() => {
    const localizedMenu = menu.map((item) => applyLocale(item, lang, ["label"]));
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
      hubs: hubsRaw.map((item) => applyLocale(item, lang, ["title", "text"])),
    };
  }, [lang, menu, settingsRaw, hubsRaw]);
}
