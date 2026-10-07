import type { Request, Response } from "express";
import { readSnapshot, snapshotKeys } from "./sync";

/** GET /api/public/market/:key — последний снимок раздела kse.kg (данные + когда получены + источник). */
export async function getMarketSnapshot(req: Request, res: Response) {
  const key = String(req.params.key);
  if (!snapshotKeys.includes(key)) {
    res.status(404).json({ error: "Неизвестный раздел", keys: snapshotKeys });
    return;
  }
  const row = await readSnapshot(key);
  if (!row) {
    res.status(404).json({ error: "Данные ещё не загружены с kse.kg" });
    return;
  }
  res.json({ key, data: row.data, fetchedAt: row.fetchedAt.toISOString(), sourceUrl: row.sourceUrl, stale: Boolean(row.error) });
}
