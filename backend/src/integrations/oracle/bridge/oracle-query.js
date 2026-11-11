/*
 * Мост к Oracle 8i. Запускается движком jjs (Nashorn) из Java 8 со старым JDBC-драйвером classes12.zip —
 * только он ещё умеет подключаться к 8i (node-oracledb и Instant Client 19c получают ORA-03134).
 * Компилировать ничего не нужно.
 *
 *   jjs -cp classes12.zip;nls_charset12.zip oracle-query.js
 *
 * Вход — переменные окружения (так пароль не виден в списке процессов):
 *   ORACLE_URL      jdbc:oracle:thin:@host:port:sid
 *   ORACLE_USER, ORACLE_PASSWORD
 *   ORACLE_SQL      один SELECT с параметрами «?»
 *   ORACLE_PARAMS   JSON-массив строк для «?» (необязательно)
 *   ORACLE_MAX_ROWS ограничение числа строк (необязательно)
 * Выход — UTF-8 JSON в stdout: { "columns": [...], "rows": [[...], ...] }; ошибка — текст в stderr и код 1.
 * Числа отдаются строками (без потери точности), даты — «ГГГГ-ММ-ДД ЧЧ:ММ:СС», пусто — null.
 */
var System = Java.type("java.lang.System");
var DriverManager = Java.type("java.sql.DriverManager");
var Types = Java.type("java.sql.Types");
var JString = Java.type("java.lang.String");
var PrintStream = Java.type("java.io.PrintStream");
var SimpleDateFormat = Java.type("java.text.SimpleDateFormat");

var env = System.getenv();
var sql = env.get("ORACLE_SQL");
// Только чтение: мост не должен ничего менять в Oracle. Драйвер 8i не поддерживает setReadOnly, поэтому
// пропускаем ровно один SELECT без «;» (вторую команду через точку с запятой не приписать).
if (!sql || !/^\s*(select|with)\b/i.test(sql) || sql.indexOf(";") >= 0) {
  System.err.println("ORACLE_SQL must be a single SELECT");
  System.exit(1);
}
var params = env.get("ORACLE_PARAMS") ? JSON.parse(env.get("ORACLE_PARAMS")) : [];
var maxRows = env.get("ORACLE_MAX_ROWS") ? parseInt(env.get("ORACLE_MAX_ROWS"), 10) : 0;
var dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

/** Строки в базе хранятся байтами: пробуем UTF-8, при битых символах — Windows-1251. */
function text(rs, i) {
  var bytes = rs.getBytes(i);
  if (bytes === null) return null;
  var utf8 = new JString(bytes, "UTF-8");
  var value = utf8.indexOf("�") >= 0 ? new JString(bytes, "Cp1251") : utf8;
  return String(value).replace(/\s+$/, "");
}

var out = new PrintStream(System.out, true, "UTF-8");
var err = new PrintStream(System.err, true, "UTF-8");
var conn = null;
try {
  Java.type("java.lang.Class").forName("oracle.jdbc.driver.OracleDriver");
  conn = DriverManager.getConnection(env.get("ORACLE_URL"), env.get("ORACLE_USER"), env.get("ORACLE_PASSWORD"));
  var ps = conn.prepareStatement(sql);
  if (maxRows > 0) ps.setMaxRows(maxRows);
  for (var p = 0; p < params.length; p++) ps.setString(p + 1, params[p] === null ? null : String(params[p]));
  var rs = ps.executeQuery();
  var meta = rs.getMetaData();
  var count = meta.getColumnCount();
  var columns = [];
  var types = [];
  for (var c = 1; c <= count; c++) {
    columns.push(String(meta.getColumnName(c)));
    types.push(meta.getColumnType(c));
  }
  var rows = [];
  while (rs.next()) {
    var row = [];
    for (var k = 1; k <= count; k++) {
      var type = types[k - 1];
      if (type === Types.DATE || type === Types.TIMESTAMP) {
        var ts = rs.getTimestamp(k);
        row.push(ts === null ? null : String(dateFormat.format(ts)));
      } else if (type === Types.NUMERIC || type === Types.DECIMAL || type === Types.INTEGER || type === Types.FLOAT || type === Types.DOUBLE) {
        var n = rs.getBigDecimal(k);
        row.push(n === null ? null : String(n.toPlainString()));
      } else {
        row.push(text(rs, k));
      }
    }
    rows.push(row);
  }
  out.println(JSON.stringify({ columns: columns, rows: rows }));
} catch (e) {
  // Только текст ошибки (ORA-…), без стека и без параметров подключения.
  var message = e.getMessage ? e.getMessage() : String(e);
  if (e.getCause && e.getCause()) message = e.getCause().getMessage();
  err.println(String(message).replace(/^java\.\S+:\s*/, ""));
  if (conn !== null) conn.close();
  System.exit(1);
}
if (conn !== null) conn.close();
