import Image from "next/image";
import type { CSSProperties } from "react";
import type { InstrumentType } from "@/data/catalog";
import css from "./sector.module.css";

/** Фото отрасли эмитента: по названию компании, иначе — по виду бумаги. Источники — public/hero/CREDITS.md. */
const bySector: [RegExp, string][] = [
  [/нефт/i, "/sectors/oil.jpg"],
  [/аэропорт|манас/i, "/sectors/airport.jpg"],
  [/электрическ\S* станц/i, "/sectors/power.jpg"],
  [/гидро|гэс/i, "/sectors/hydro.jpg"],
  [/электрическ\S* сет|нэск/i, "/sectors/grid.jpg"],
  [/телеком/i, "/sectors/telecom.jpg"],
  [/алтын/i, "/sectors/gold-mine.jpg"],
  [/учкун/i, "/sectors/printing.jpg"],
  [/канд|кант|сахар/i, "/sectors/sugar.jpg"],
  [/банк/i, "/sectors/bank.jpg"],
];


export function sectorPhoto(name: string, type: InstrumentType, ticker = "") {
  const hit = bySector.find(([pattern]) => pattern.test(name));
  if (hit) return hit[1];
  if (type === "metal") return "/carousel/gold.jpg";
  // ГКО и ГКВ на карте обычно стоят рядом — у каждого вида свой кадр Бишкека, чтобы плитки не повторялись.
  if (type === "gcb" || /министерство финансов|минфин/i.test(name)) return /^GKO/i.test(ticker) ? "/carousel/city.jpg" : "/hub/hub-gcb.jpg";
  return "/carousel/city.jpg";
}

/**
 * Фон плитки карты рынка: фото отрасли под затемнением цвета макета (tint).
 * Ставится первым ребёнком ссылки-плитки; подписи после него поднимаются над фото и становятся светлыми.
 */
export function SectorPhoto({
  name,
  type,
  ticker,
  tint,
  sizes = "(max-width: 767px) 50vw, 420px",
}: {
  name: string;
  type: InstrumentType;
  ticker?: string;
  tint: string;
  sizes?: string;
}) {
  return (
    <span className={css.photo} style={{ "--tint": tint } as CSSProperties} aria-hidden="true">
      <Image src={sectorPhoto(name, type, ticker)} alt="" fill sizes={sizes} />
    </span>
  );
}
