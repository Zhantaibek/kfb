"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteSplash } from "@/components/SiteSplash";
import { TickerTape } from "@/components/TickerTape";
import { SiteNavProvider } from "@/lib/cms/use-site-nav";

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

  useEffect(() => {
    if (isAdmin) return;
    void fetch("/api/public/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    });
  }, [pathname, isAdmin]);

  useEffect(() => {
    if (isAdmin) return;
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
  }, [pathname, isAdmin]);

  if (isAdmin) return <>{children}</>;

  return (
    <SiteNavProvider>
      <SiteSplash />
      <TickerTape />
      <SiteHeader />
      {children}
      <SiteFooter />
    </SiteNavProvider>
  );
}
