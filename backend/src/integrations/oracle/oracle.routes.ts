import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { requireSession } from "../../modules/auth/auth.service";
import { monthlyIndexChart } from "./oracle.index";
import { readOracleQuotes } from "./oracle.quotes";
import { readGcbAuctions } from "./oracle.auctions";
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

/** Публично: котировки по ценным бумагам (лучшие заявки) из торговой системы. */
publicOracleRoutes.get(
  "/quotes",
  asyncHandler(async (_req, res) => {
    const snapshot = await readOracleQuotes();
    if (!snapshot) {
      res.status(404).json({ error: "Котировок из торговой системы ещё нет" });
      return;
    }
    res.json(snapshot);
  }),
);

/** Публично: результаты аукционов ГЦБ из аукционной системы (наша таблица gcb_auctions). */
publicOracleRoutes.get(
  "/auctions",
  asyncHandler(async (_req, res) => {
    res.json({ rows: await readGcbAuctions() });
  }),
);

/** Публично: точки графиков индекса KSE и капитализации за 12 месяцев (максимум за месяц, как на главной kse.kg). */
publicOracleRoutes.get(
  "/index-chart",
  asyncHandler(async (_req, res) => {
    res.json(await monthlyIndexChart());
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
