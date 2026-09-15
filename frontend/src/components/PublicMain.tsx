"use client";

import { type ReactNode } from "react";
import ui from "@/app/ui.module.css";
import { localizeNode, useTr } from "@/lib/use-tr";

export function PublicMain({ children, className }: { children: ReactNode; className?: string }) {
  const translate = useTr();
  return <main className={className ?? ui.wrap}>{localizeNode(children, translate)}</main>;
}
