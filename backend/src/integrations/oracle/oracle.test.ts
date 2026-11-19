
import oracledb from "oracledb";
import { config as loadEnv } from "dotenv";
import path from "node:path";

// Загружаем переменные окружения
loadEnv({ path: path.resolve(process.cwd(), "../.env") });

// Подключаем Oracle Instant Client (Thick Mode)
oracledb.initOracleClient({
  libDir: "C:\\oracle\\instantclient_19_33",
});

console.log("Oracle Thin Mode:", oracledb.thin);

async function main() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_DB_USER,
      password: process.env.ORACLE_DB_PASSWORD,

      connectString: `(DESCRIPTION=
        (ADDRESS=(PROTOCOL=TCP)
          (HOST=${process.env.ORACLE_DB_HOST})
          (PORT=${process.env.ORACLE_DB_PORT})
        )
        (CONNECT_DATA=(SID=${process.env.ORACLE_DB_SID}))
      )`,
    });

    const result = await connection.execute(
      `SELECT
        SYS_CONTEXT('USERENV', 'DB_NAME') AS DB_NAME,
        SYS_CONTEXT('USERENV', 'SERVICE_NAME') AS SERVICE_NAME,
        USER AS DB_USER
       FROM DUAL`,
    );

    console.log("Oracle connection successful!");
    console.log(result.rows);
  } catch (error) {
    console.error("Oracle connection failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

main();
