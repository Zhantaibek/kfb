"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import ui from "@/app/ui.module.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteSplash } from "@/components/SiteSplash";
import { TickerTape } from "@/components/TickerTape";
import { SiteNavProvider } from "@/lib/cms/use-site-nav";

/** Случайный id браузера для подсчёта уникальных посетителей (без cookie и личных данных). */
function visitorId() {
  try {
    let id = localStorage.getItem("kse-visitor");
    if (!id) {
      id = `v_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
      localStorage.setItem("kse-visitor", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

function collectRevealNodes() {
  const nodes: Element[] = [...document.querySelectorAll('main section:not([aria-roledescription]), footer')];
  const main = document.querySelector("main");
  if (main && !main.querySelector("section")) {
    nodes.push(...main.children);
  }
  return nodes.filter((node, index, list) => list.indexOf(node) === index);
}

function collectStaggerItems(root: Element) {
  const items = [...root.querySelectorAll(":scope [data-stagger] > *, :scope ol > li, :scope ul > li")];
  return items.filter((item) => !item.closest("[aria-hidden='true']"));
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const bare = isAdmin;

  useEffect(() => {
    if (isAdmin) return;
    void fetch("/api/public/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname, visitorId: visitorId() }),
    });
  }, [pathname, isAdmin]);

  useEffect(() => {
    if (bare) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.documentElement.classList.add("js-reveal");
    const nodes = collectRevealNodes();
    nodes.forEach((node) => node.setAttribute("data-reveal", ""));

    const items = new Map<Element, Element[]>();
    for (const node of nodes) {
      const list = collectStaggerItems(node);
      list.forEach((item, i) => {
        item.setAttribute("data-reveal-item", "");
        (item as HTMLElement).style.setProperty("--reveal-i", String(Math.min(i, 8)));
      });
      items.set(node, list);
    }

    const timers: number[] = [];
    const releaseItems = (list: Element[]) => {
      list.forEach((item) => {
        item.removeAttribute("data-reveal-item");
        (item as HTMLElement).style.removeProperty("--reveal-i");
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
          const list = items.get(entry.target) ?? [];
          if (list.length) timers.push(window.setTimeout(() => releaseItems(list), 1600));
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -12% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
      items.forEach(releaseItems);
      nodes.forEach((node) => {
        node.classList.remove("is-visible");
        node.removeAttribute("data-reveal");
      });
    };
  }, [pathname, bare]);

  if (bare) return <>{children}</>;

  return (
    <SiteNavProvider>
      {/* Колонка на всю высоту окна: на коротких страницах подвал прижат к низу экрана. */}
      <div className={ui.siteShell}>
        <SiteSplash />
        <TickerTape />
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </SiteNavProvider>
  );
}
