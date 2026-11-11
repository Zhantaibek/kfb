import assert from "node:assert/strict";
import { test } from "node:test";
import { bridgeErrorMessage, toObjects } from "../integrations/oracle/oracle.service";
import { aggregateTrades, bishkekToday, decodeLongDate, encodeLongDate } from "../integrations/oracle/oracle.trades";

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
