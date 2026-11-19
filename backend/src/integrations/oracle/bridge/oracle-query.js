/*
 * Мост к Oracle 8i. Запускается движком Nashorn из Java 8 со старым JDBC-драйвером classes12.zip —
 * только он ещё умеет подключаться к 8i (node-oracledb и Instant Client 19c получают ORA-03134).
 * Компилировать ничего не нужно:
 *
 *   java -cp classes12.zip;nls_charset12.zip jdk.nashorn.tools.Shell oracle-query.js
 *
 * Вход — переменные окружения (так пароль не виден в списке процессов):
 *   ORACLE_URL      jdbc:oracle:thin:@host:port:sid
 *   ORACLE_USER, ORACLE_PASSWORD
 *   ORACLE_SQL      один SELECT с параметрами «?»
 *   ORACLE_PARAMS   JSON-массив строк для «?» (необязательно)
 *   ORACLE_MAX_ROWS ограничение числа строк (необязательно)
 * Выход — UTF-8 JSON в stdout: { "columns": [...], "rows": [[...], ...] }; ошибка — текст в stderr и код 1.
 * Числа отдаются строками (без потери точности), даты — «ГГГГ-ММ-ДД ЧЧ:ММ:СС», пусто — null.
 *
 * ТОЛЬКО ЧТЕНИЕ. Мост не может изменить данные биржи — защита в два слоя:
 *  1. Текст запроса: ровно один SELECT, без «;», без комментариев и без слов, которыми что-то меняют или
 *     запускают (INSERT, UPDATE, DELETE, DROP, ALTER, FOR UPDATE, вызовы DBMS_/UTL_ и т. п.).
 *  2. Сама база: запрос выполняется внутри транзакции SET TRANSACTION READ ONLY — Oracle сам отклонит любую
 *     запись (ORA-01456), даже если проверка текста что-то пропустит. В конце — всегда ROLLBACK, COMMIT не вызывается.
 * Та же проверка текста есть в Node (oracle.service.ts) — запрос отклоняется ещё до запуска Java.
 */
var System = Java.type("java.lang.System");
var DriverManager = Java.type("java.sql.DriverManager");
var Types = Java.type("java.sql.Types");
var JString = Java.type("java.lang.String");
var PrintStream = Java.type("java.io.PrintStream");
var SimpleDateFormat = Java.type("java.text.SimpleDateFormat");

var out = new PrintStream(System.out, true, "UTF-8");
var err = new PrintStream(System.err, true, "UTF-8");

function fail(message) {
  err.println(message);
  System.exit(1);
}

/** Почему запрос не только для чтения; null — запрос допустим. Должна совпадать с readOnlyProblem в oracle.service.ts. */
function readOnlyProblem(sql) {
  if (!sql || !String(sql).trim()) return "пустой запрос";
  sql = String(sql);
  if (sql.indexOf("--") >= 0 || sql.indexOf("/*") >= 0) return "комментарии в запросе запрещены";
  // Строки в кавычках не проверяем на слова: в них может быть любой текст.
  var bare = sql.replace(/'(?:[^']|'')*'/g, " STR ");
  if (bare.indexOf("'") >= 0) return "незакрытая кавычка";
  if (bare.indexOf(";") >= 0) return "разрешена только одна команда (без «;»)";
  if (!/^\s*select\b/i.test(bare)) return "разрешён только SELECT";
  var forbidden = /\b(insert|update|delete|merge|drop|alter|create|grant|revoke|truncate|rename|lock|commit|rollback|savepoint|execute|exec|call|begin|declare|into|dbms_\w+|utl_\w+)\b/i;
  var word = bare.match(forbidden);
  return word ? "запрещённое слово в запросе: " + word[1].toUpperCase() : null;
}

var env = System.getenv();
var sql = env.get("ORACLE_SQL");
var problem = readOnlyProblem(sql);
if (problem !== null) fail("Только чтение: " + problem);

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

function closeQuietly(conn) {
  if (conn === null) return;
  try {
    conn.rollback();
  } catch (ignored) {}
  try {
    conn.close();
  } catch (ignored) {}
}

var conn = null;
try {
  Java.type("java.lang.Class").forName("oracle.jdbc.driver.OracleDriver");
  conn = DriverManager.getConnection(env.get("ORACLE_URL"), env.get("ORACLE_USER"), env.get("ORACLE_PASSWORD"));
  // Без автокоммита и в транзакции только для чтения: база сама запретит любую запись.
  conn.setAutoCommit(false);
  var guard = conn.createStatement();
  guard.execute("SET TRANSACTION READ ONLY");
  guard.close();

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
  rs.close();
  ps.close();
  out.println(JSON.stringify({ columns: columns, rows: rows }));
} catch (e) {
  // Только текст ошибки (ORA-…), без стека и без параметров подключения.
  var message = e.getMessage ? e.getMessage() : String(e);
  if (e.getCause && e.getCause()) message = e.getCause().getMessage();
  closeQuietly(conn);
  fail(String(message).replace(/^java\.\S+:\s*/, ""));
}
closeQuietly(conn);
