/**
 * Шкала графика с круглыми делениями (6000, 6500 … 9000): шаг 1 / 2 / 2,5 / 5 × 10ⁿ, около шести делений,
 * границы кратны шагу и охватывают все значения. Сами данные не меняются — только подписи и границы оси.
 */
export function niceScale(values: number[], targetTicks = 6) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return null;
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / targetTicks;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? 10 * power;
  const from = Math.floor(min / step) * step;
  const to = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = from; v <= to + step / 2; v += step) ticks.push(Math.round(v / step) * step);
  return { domain: [from, to] as [number, number], ticks, step };
}

/** «2026-05-25» или «25-05-2026» / «25.05.2026» → «25-05-2026» — подписи дат на графиках рынка, как на kse.kg. */
export function chartDate(value: string) {
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  return value.replace(/\./g, "-");
}
