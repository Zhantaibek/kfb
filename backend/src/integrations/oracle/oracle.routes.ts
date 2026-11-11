import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { requireSession } from "../../modules/auth/auth.service";
import { oracleSyncStatus, readOracleTrades, syncOracleTrades } from "./oracle.sync";

/** Публично: последний снимок итогов торгов из торговой системы. */
export const publicOracleRoutes = Router();

publicOracleRoutes.get(
  "/trades",
  asyncHandler(async (_req, res) => {
    const snapshot = await readOracleTrades();
    if (!snapshot) {
      res.status(404).json({ error: "Данных из торговой системы ещё нет" });
      return;
    }
    res.json(snapshot);
  }),
);

/** Только для вошедших сотрудников: состояние синхронизации и ручной запуск. */
export const adminOracleRoutes = Router();

adminOracleRoutes.use((req, res, next) => {
  requireSession(req).then(
    () => next(),
    () => res.status(401).json({ error: "unauthorized" }),
  );
});

adminOracleRoutes.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const snapshot = await readOracleTrades();
    res.json({
      ...oracleSyncStatus(),
      lastDate: snapshot?.data.date ?? null,
      trades: snapshot?.data.trades.length ?? 0,
      fetchedAt: snapshot?.fetchedAt ?? null,
      checkedAt: snapshot?.checkedAt ?? null,
      error: snapshot?.error ?? null,
    });
  }),
);

adminOracleRoutes.post(
  "/sync",
  asyncHandler(async (_req, res) => {
    const result = await syncOracleTrades();
    res.status(result.ok ? 200 : 502).json(result);
  }),
);
