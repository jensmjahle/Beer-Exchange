// server/db/postgres.ts
import pg from "pg";
import fs from "fs";
import path from "path";

const sqlCache = new Map<string, string>();

function loadSql(filePath: string): string {
  if (sqlCache.has(filePath)) return sqlCache.get(filePath)!;

  const fullPath = path.join(process.cwd(), "server", "db", "sql", filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`SQL file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, "utf8");
  sqlCache.set(filePath, content);
  return content;
}

export async function makePostgresAdapter() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  await pool.query("SELECT 1+1");
  console.log("[DB] Adapter loaded: PostgreSQL 🐘");

  return {
    kind: "pg" as const,

    async init() {
      // Optional migrations or setup can go here
    },

    async query(text: string, params?: any[]) {
      let sql = text;

      // 💡 Kun last fra fil hvis det er et filnavn (ikke en SQL-setning)
      if (!text.includes(" ") && text.endsWith(".sql")) {
        sql = loadSql(text);
      }

      return pool.query(sql, params);
    },

    async close() {
      await pool.end();
    },
  };
}
