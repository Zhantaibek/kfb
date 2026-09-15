"use client";

import Link from "next/link";
import { useLocalizedList } from "@/lib/cms/use-localized";
import type { CmsNews } from "@/lib/cms/types";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";

export function NewsList({ items }: { items: CmsNews[] }) {
  const tr = useTr();
  const rows = useLocalizedList(items, ["title", "excerpt", "tag"]);
  return (
    <div className={ui.list}>
      {rows.map((item) => (
        <Link className={ui.row} href={`/news/${item.slug}`} key={item.slug}>
          <small>
            {item.date} · {tr(item.tag)}
          </small>
          <h3>{tr(item.title)}</h3>
          <p>{tr(item.excerpt)}</p>
        </Link>
      ))}
    </div>
  );
}
