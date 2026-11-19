/** Плитка карты рынка: координаты и размеры — в процентах контейнера. */
export type TreemapTile<T> = { item: T; left: number; top: number; width: number; height: number };

type Node<T> = { item: T; area: number };

/**
 * Squarified treemap (Bruls, Huizing, van Wijk): площадь плитки пропорциональна значению,
 * а плитки остаются близкими к квадрату — так подписи читаются лучше, чем в полосах.
 * width/height задают пропорции контейнера; результат — в процентах.
 */
export function treemap<T>(items: T[], value: (item: T) => number, width: number, height: number): TreemapTile<T>[] {
  const total = items.reduce((sum, item) => sum + value(item), 0);
  if (!total) return [];
  const scale = (width * height) / total;
  const nodes: Node<T>[] = items.map((item) => ({ item, area: value(item) * scale })).sort((a, b) => b.area - a.area);
  const tiles: TreemapTile<T>[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;

  // Худшее соотношение сторон в ряду: чем ближе к 1, тем квадратнее плитки.
  const worst = (row: Node<T>[], side: number) => {
    const sum = row.reduce((acc, node) => acc + node.area, 0);
    const max = Math.max(...row.map((node) => node.area));
    const min = Math.min(...row.map((node) => node.area));
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
  };

  const place = (row: Node<T>[]) => {
    const sum = row.reduce((acc, node) => acc + node.area, 0);
    if (w >= h) {
      const colW = sum / h;
      let cy = y;
      for (const node of row) {
        const cellH = node.area / colW;
        tiles.push({ item: node.item, left: x, top: cy, width: colW, height: cellH });
        cy += cellH;
      }
      x += colW;
      w -= colW;
    } else {
      const rowH = sum / w;
      let cx = x;
      for (const node of row) {
        const cellW = node.area / rowH;
        tiles.push({ item: node.item, left: cx, top: y, width: cellW, height: rowH });
        cx += cellW;
      }
      y += rowH;
      h -= rowH;
    }
  };

  let row: Node<T>[] = [];
  for (const node of nodes) {
    const side = Math.min(w, h);
    if (!row.length || worst([...row, node], side) <= worst(row, side)) {
      row.push(node);
    } else {
      place(row);
      row = [node];
    }
  }
  if (row.length) place(row);

  return tiles.map((tile) => ({
    item: tile.item,
    left: (tile.left / width) * 100,
    top: (tile.top / height) * 100,
    width: (tile.width / width) * 100,
    height: (tile.height / height) * 100,
  }));
}
