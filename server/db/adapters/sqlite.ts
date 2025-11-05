// server/db/adapters/sqlite.ts
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { DBAdapter } from "../adapter.js";

const sql = {
  insert: fs.readFileSync(
    path.resolve("server/db/sql/transactions/insertTransaction.sql"),
    "utf8",
  ),
  list: fs.readFileSync(
    path.resolve("server/db/sql/transactions/listTransactions.sql"),
    "utf8",
  ),
};

let db;

export const SQLiteAdapter: DBAdapter = {
  async init() {
    db = new Database("data.sqlite");
    console.log("🐍 Using SQLite DB");
  },

  async insertTransaction(tx) {
    db.prepare(sql.insert).run(tx);
  },

  async listTransactions(eventId, limit = 100) {
    return db.prepare(sql.list).all(eventId, limit);
  },
};
