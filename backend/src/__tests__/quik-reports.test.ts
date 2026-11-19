import assert from "node:assert/strict";
import { test } from "node:test";
import { queryReports, quikErrorMessage, readOnlyProblem } from "../integrations/quik-reports/quik.service";

test("QUIK Reports: обычные SELECT проходят", () => {
  assert.equal(readOnlyProblem("SELECT TOP 3 * FROM [dbo].[Firms]"), null);
  assert.equal(readOnlyProblem("SELECT f.name, s.isin FROM firms f JOIN securities s ON s.firm_id = f.id WHERE s.class_code = @p0"), null);
  assert.equal(readOnlyProblem("SELECT USER_NAME(o.uid) AS sch, o.name FROM sysobjects o"), null);
  // Слова в строках не мешают.
  assert.equal(readOnlyProblem("SELECT * FROM firms WHERE note = 'exec into backup'"), null);
});

test("QUIK Reports: всё, что пишет или запускает, отклоняется", () => {
  for (const sql of [
    "EXEC sp_who",
    "SELECT 1; DROP TABLE firms",
    "SELECT * INTO copy_firms FROM firms",
    "SELECT * FROM OPENROWSET('SQLNCLI', 'x', 'SELECT 1')",
    "SELECT xp_cmdshell('dir')",
    "SELECT 1 WAITFOR DELAY '00:00:10'",
    "SELECT 1 -- comment",
    "UPDATE firms SET name = 'x'",
    "DELETE FROM firms",
  ]) {
    assert.notEqual(readOnlyProblem(sql), null, sql);
  }
});

test("QUIK Reports: без настроек запрос не уходит, пароль не попадает в текст ошибки", async () => {
  await assert.rejects(queryReports("DELETE FROM firms"), /Только чтение/);
  if (!process.env.QUIK_REPORTS_HOST) await assert.rejects(queryReports("SELECT 1 AS x"), /не настроен/);
  assert.equal(quikErrorMessage(new Error("Login failed\n  for user")), "Login failed for user");
});
