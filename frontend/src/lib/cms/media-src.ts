/** Busts Next/browser caches when public JPGs are replaced in place. */
const REV = "20260928g";

export function mediaSrc(src: string) {
  if (!src) return src;
  return src.includes("?") ? `${src}&v=${REV}` : `${src}?v=${REV}`;
}
