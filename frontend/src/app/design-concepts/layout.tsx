import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MotionRoot } from "./_shared/Motion";
import "./_shared/motion.css";

// Макеты для выбора дизайна: в поиск не попадают, шапку и подвал сайта не показывают (см. SiteChrome).
export const metadata: Metadata = {
  title: { default: "Концепции главной", template: "%s · Концепции главной" },
  robots: { index: false, follow: false },
};

export default function ConceptsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <MotionRoot />
    </>
  );
}
