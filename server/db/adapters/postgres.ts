// server/db/adapters/postgres.ts
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { DBAdapter } from "../adapter.js";

const sql = {
  insert: fs.readFileSync(
    path.resolve("server/db/sql/transactions/insert.sql"),
    "utf8",
  ),
  list: fs.readFileSync(
    path.resolve("server/db/sql/transactions/list.sql"),
    "utf8",
  ),
};

let pool;

export const PostgresAdapter: DBAdapter = {
  async init() {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    console.log("🐘 Connected to Postgres");
  },

  async insertTransaction(tx) {
    await pool.query(sql.insert, [
      tx.id,
      tx.event_id,
      tx.event_beer_id,
      tx.customer_id,
      tx.qty,
      tx.volume_ml,
      tx.unit_price,
      tx.created_at,
    ]);
  },

  async listTransactions(eventId, limit = 100) {
    const { rows } = await pool.query(sql.list, [eventId, limit]);
    return rows;
  },
};
