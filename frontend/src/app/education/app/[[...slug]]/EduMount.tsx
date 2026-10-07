"use client";

import dynamic from "next/dynamic";

// Приложение учебного центра работает только в браузере (React Router, localStorage).
const EduHost = dynamic(() => import("@/edu/EduHost").then((mod) => mod.EduHost), { ssr: false });

export function EduMount() {
  return <EduHost />;
}
