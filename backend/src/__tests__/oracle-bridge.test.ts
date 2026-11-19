import assert from "node:assert/strict";
import { test } from "node:test";
import { bridgeErrorMessage, queryOracle, readOnlyProblem, toObjects } from "../integrations/oracle/oracle.service";
import { aggregateTrades, bishkekToday, decodeLongDate, encodeLongDate } from "../integrations/oracle/oracle.trades";
import { buildTradeDays, changePercent } from "../integrations/oracle/oracle.tradedays";
import { buildIndexDays } from "../integrations/oracle/oracle.index";

test("индекс KSE: дата, значение, капитализация, изменение к предыдущей дате", () => {
  const days = buildIndexDays(
    [
      { DATE0: String(encodeLongDate("2026-11-10")), IND: "8408.35", CAP: "293011704759.20" },
      { DATE0: String(encodeLongDate("2026-11-11")), IND: "8451.49", CAP: "294515238695.20" },
    ],
    8408.35,
  );
  assert.deepEqual(days[0], { date: "2026-11-10", value: 8408.35, capitalization: 293011704759.2, changePercent: 0 });
  assert.equal(days[1].changePercent, 0.51);
  assert.equal(buildIndexDays([{ DATE0: String(encodeLongDate("2004-01-01")), IND: "100", CAP: null }])[0].changePercent, null);
});

test("итоги по дням: вторичный и нелистинг — разница, изменение к прошлому дню в % (как mod_tradestat)", () => {
  const days = buildTradeDays([
    { DATE0: String(encodeLongDate("2026-11-10")), TOTAL: "0.0122", PRIMARY_VOL: "0", LISTING_VOL: "0.0122" },
    { DATE0: String(encodeLongDate("2026-11-11")), TOTAL: "0.0676", PRIMARY_VOL: "0.0008", LISTING_VOL: "0.0676" },
  ]);
  assert.equal(days[0].date, "2026-11-10");
  assert.equal(days[0].totalChange, null); // нет предыдущего дня
  assert.deepEqual(
    { date: days[1].date, secondary: days[1].secondary, nonListing: days[1].nonListing, totalChange: days[1].totalChange, listingChange: days[1].listingChange },
    { date: "2026-11-11", secondary: 0.0668, nonListing: 0, totalChange: 454.1, listingChange: 454.1 },
  );
  // Рост с нуля — процент не определён.
  assert.equal(days[1].primaryChange, null);
  assert.equal(changePercent(5, 10), -50);
});

test("дата торговой системы: год × 65536 + месяц × 256 + день (как TS.MAKELONGDATE)", () => {
  // Значения сверены с ответом TS.MAKELONGDATE в базе биржи.
  assert.equal(encodeLongDate("2026-11-10"), 132778762);
  assert.equal(encodeLongDate("2026-11-11"), 132778763);
  assert.equal(encodeLongDate("2026-01-01"), 132776193);
  assert.equal(decodeLongDate(132778758), "2026-11-06");
  assert.equal(decodeLongDate(encodeLongDate("2025-12-31")), "2025-12-31");
});

test("торговый день считается по времени Бишкека", () => {
  // 20:30 UTC 10 ноября — в Бишкеке (UTC+6) уже 11 ноября.
  assert.equal(bishkekToday(new Date("2026-11-10T20:30:00Z")), "2026-11-11");
});

test("только чтение: обычные SELECT проходят", () => {
  assert.equal(readOnlyProblem("SELECT ID, NAMERUS FROM TS.CURRINSTRUMENT WHERE ID = ?"), null);
  assert.equal(readOnlyProblem("select max(DATE0) as LAST_DAY from (select DATE0 from TS.DEAL union all select DATE0 from ARCTS.DEAL)"), null);
  // Слово внутри строки в кавычках — это данные, а не команда.
  assert.equal(readOnlyProblem("SELECT ID FROM TS.CURRINSTRUMENT WHERE NAMERUS = 'delete me; drop'"), null);
  // Колонки, похожие на запрещённые слова, не мешают (\b — целое слово).
  assert.equal(readOnlyProblem("SELECT LASTUPDATE, CREATED_AT FROM T"), null);
});

test("только чтение: всё, что меняет данные или запускает код, отклоняется", () => {
  const blocked = [
    "INSERT INTO TS.DEAL VALUES (1)",
    "UPDATE TS.DEAL SET PRICE = 0",
    "DELETE FROM TS.DEAL",
    "DROP TABLE TS.DEAL",
    "ALTER TABLE TS.DEAL ADD X NUMBER",
    "TRUNCATE TABLE TS.DEAL",
    "SELECT * FROM TS.DEAL FOR UPDATE",
    "SELECT 1 FROM DUAL; DELETE FROM TS.DEAL",
    "SELECT 1 FROM DUAL -- ; DELETE",
    "SELECT 1 FROM DUAL /* */",
    "SELECT ID INTO x FROM TS.DEAL",
    "SELECT DBMS_JOB.SUBMIT(1) FROM DUAL",
    "SELECT UTL_FILE.FOPEN('a','b','w') FROM DUAL",
    "BEGIN NULL END",
    "LOCK TABLE TS.DEAL IN EXCLUSIVE MODE",
    "SELECT 'x FROM DUAL",
    "  ",
  ];
  for (const sql of blocked) assert.notEqual(readOnlyProblem(sql), null, sql);
});

test("запрос на запись отклоняется ещё до запуска Java", async () => {
  await assert.rejects(queryOracle("DELETE FROM TS.DEAL"), /Только чтение/);
});

test("строки моста превращаются в объекты по именам колонок", () => {
  assert.deepEqual(toObjects({ columns: ["A", "B"], rows: [["1", null]] }), [{ A: "1", B: null }]);
});

test("из ошибки Java остаётся только ORA-код и текст", () => {
  const stderr = "Exception in thread \"main\" java.lang.RuntimeException: java.sql.SQLException: ORA-00942: table or view does not exist\n\tat oracle.jdbc...";
  assert.equal(bridgeErrorMessage(stderr), "ORA-00942: table or view does not exist");
});

const deal = (serial: string, ownId: string, price: string, volume: string, amount: string, symbol = "KNEF3") => ({
  SERIAL: serial,
  OWNID: ownId,
  PRICE: price,
  VOLUME: volume,
  VOLCONTR: amount,
  EXTCODE: "KG0103080939",
  SHORTNAME: symbol,
  NAMERUS: " ОАО Кыргызнефтегаз, акция простая",
});

test("итоги дня: сделки по SERIAL без повторов, суммы, мин/макс, цена открытия и закрытия", () => {
  const snapshot = aggregateTrades("2026-11-11", [
    deal("10", "7", "259", "10", "2590"),
    deal("10", "7", "259", "10", "2590"), // вторая сторона той же сделки
    deal("12", "7", "263.95999999999998", "100", "26396"),
    deal("11", "7", "250", "5", "1250"),
    deal("20", "9", "419", "106", "44414", "MAIR3"),
  ]);
  const knef = snapshot.trades.find((trade) => trade.symbol === "KNEF3");
  assert.ok(knef);
  assert.equal(knef.deals, 3);
  assert.equal(knef.count, 115);
  assert.equal(knef.volume, 30236);
  assert.equal(knef.minPrice, 250);
  assert.equal(knef.maxPrice, 263.96);
  assert.equal(knef.openPrice, 259); // наименьший SERIAL
  assert.equal(knef.lastPrice, 263.96); // наибольший SERIAL
  assert.equal(knef.name, "ОАО Кыргызнефтегаз, акция простая");
  // По убыванию суммы: MAIR3 (44 414) раньше KNEF3 (30 236).
  assert.deepEqual(snapshot.trades.map((trade) => trade.symbol), ["MAIR3", "KNEF3"]);
  assert.deepEqual(snapshot.totals, { deals: 4, count: 221, volume: 74650 });
});

test("день без сделок даёт пустые итоги", () => {
  assert.deepEqual(aggregateTrades("2026-11-12", []), { date: "2026-11-12", trades: [], totals: { deals: 0, count: 0, volume: 0 } });
});

test("бумага без записи в справочнике не теряется", () => {
  const snapshot = aggregateTrades("2026-11-11", [{ SERIAL: "1", OWNID: "55", PRICE: "1", VOLUME: "1", VOLCONTR: "1", EXTCODE: null, SHORTNAME: null, NAMERUS: null }]);
  assert.equal(snapshot.trades[0].name, "Инструмент 55");
});
