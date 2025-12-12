// server/db/migrate.ts
import fs from "node:fs";
import path from "node:path";
import db from "../db.js";

export async function runMigrations() {
  if (db.kind === "memory") {
    console.log("[migrate] memory: skip");
    return;
  }
  const dir = path.join(process.cwd(), "server", "db", "migrations");
  if (!fs.existsSync(dir)) {
    console.log("[migrate] no migrations/ dir");
    return;
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // pg
  await db.pool.query(
    `CREATE TABLE IF NOT EXISTS _migrations (filename TEXT PRIMARY KEY, ran_at TIMESTAMPTZ NOT NULL)`,
  );
  const { rows } = await db.pool.query(`SELECT filename FROM _migrations`);
  const ran = new Set<string>(rows.map((r: any) => r.filename));
  for (const f of files) {
    if (ran.has(f)) continue;
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO _migrations (filename, ran_at) VALUES ($1, NOW())`,
        [f],
      );
      await client.query("COMMIT");
      console.log(`[migrate] applied ${f}`);
    } catch (e) {
      await client.query("ROLLBACK");
      console.error(`[migrate] failed ${f}:`, e);
      throw e;
    } finally {
      client.release();
    }
  }
}
