/**
 * Сдвиг фото в тексте. Раньше сдвиг делался через transform — картинка уезжала,
 * а текст оставался на месте, и фото могло его закрыть. Теперь сдвиг задаётся
 * отступами: текст обтекает фото уже на новом месте и никогда под него не попадает.
 */

/** Отступы по умолчанию из CSS (в px), к ним прибавляется сдвиг. */
const BASE_TOP: Record<string, number> = { left: 4, right: 4, inline: 0 };
const BLOCK_TOP = 16;

/** Допустимый сдвиг для выравнивания: вверх и в сторону текста двигать нельзя. */
export function clampFigureOffset(align: string, x: number, y: number) {
  const nx = Math.round(x) || 0;
  const ny = Math.max(0, Math.round(y) || 0);
  if (align === "left" || align === "inline") return { x: Math.max(0, nx), y: ny };
  if (align === "right") return { x: Math.min(0, nx), y: ny };
  return { x: nx, y: ny };
}

/** Inline-стиль фигуры: ширина и сдвиг. */
export function figureLayoutStyle(align: string, width: string | number, x: number, y: number) {
  const offset = clampFigureOffset(align, x, y);
  const parts = [`width:${width}%`];
  const floating = align === "left" || align === "right" || align === "inline";
  if (offset.y) parts.push(`margin-top:${(floating ? BASE_TOP[align] : BLOCK_TOP) + offset.y}px`);
  if (offset.x) {
    if (align === "left" || align === "inline") parts.push(`margin-left:${offset.x}px`);
    else if (align === "right") parts.push(`margin-right:${-offset.x}px`);
    // Блочное фото стоит в строке одно — сдвиг вбок текст не задевает.
    else parts.push(`transform:translateX(${offset.x}px)`);
  }
  return parts.join(";");
}
