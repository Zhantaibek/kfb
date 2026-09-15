"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
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

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -12% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
      nodes.forEach((node) => {
        node.classList.remove("is-visible");
        node.removeAttribute("data-reveal");
      });
    };
  }, [pathname, isAdmin]);

  if (isAdmin) return <>{children}</>;

  return (
    <SiteNavProvider>
      <TickerTape />
      <SiteHeader />
      {children}
      <SiteFooter />
    </SiteNavProvider>
  );
}
