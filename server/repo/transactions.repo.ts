import crypto from "node:crypto";
import db, { Tx } from "../db/index.js";
import { getKurtasjePct } from "./customers.repo.js";
import fs from "node:fs";
import path from "node:path";

// --- beregn husets faktor basert på overskudd/underskudd -------------
export async function computeHouseFactor(eventId: string): Promise<number> {
  let total = 0,
    fair = 0;

  if (db.kind === "sqlite") {
    const r = db.sql
      .prepare(
        `
      SELECT
        COALESCE(SUM(t.qty * t.unit_price),0) AS total_income,
        COALESCE(SUM(t.qty * eb.base_price * (eb.volume_ml/1000.0)),0) AS fair_income
      FROM "transaction" t
      JOIN event_beer eb ON eb.id = t.event_beer_id
      WHERE t.event_id = ?
    `,
      )
      .get(eventId);
    total = Number(r.total_income || 0);
    fair = Number(r.fair_income || 0);
  } else if (db.kind !== "memory") {
    const { rows } = await db.pool.query(
      `
      SELECT
        COALESCE(SUM(t.qty * t.unit_price),0) AS total_income,
        COALESCE(SUM(t.qty * eb.base_price * (eb.volume_ml/1000.0)),0) AS fair_income
      FROM "transaction" t
      JOIN event_beer eb ON eb.id = t.event_beer_id
      WHERE t.event_id = $1
    `,
      [eventId],
    );
    total = Number(rows[0]?.total_income || 0);
    fair = Number(rows[0]?.fair_income || 0);
  }

  if (fair <= 0) return 1.0;
  const diff = total - fair;
  const ratio = diff / fair;
  // demping slik at huset ikke justerer for voldsomt
  const factor = 1 + ratio * 0.1;
  return Math.max(0.8, Math.min(1.2, factor));
}
// --------------------------------------------------------------------

export async function listTransactions(
  eventId: string,
  limit = 100,
): Promise<any[]> {
  if (db.kind === "memory") {
    return db.mem.transactions
      .filter((t) => String(t.event_id) === String(eventId))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, limit)
      .map((t) => {
        const c = db.mem.customers.find((x) => x.id === t.customer_id);
        const eb = db.mem.eventBeers.find((x) => x.id === t.event_beer_id);
        return {
          ...t,
          customer_name: c?.name ?? null,
          customer_profile_image_url: c?.profile_image_url ?? null,
          customer_sexual_orientation: c?.sexual_orientation ?? null,
          beer_name: eb?.name ?? null,
          beer_abv: eb?.abv ?? null,
        };
      });
  }

  // Postgres – les SQL fra egen fil
  const sqlPath = path.join(
    process.cwd(),
    "server",
    "sql",
    "listTransactions.sql",
  );
  const queryText = fs.readFileSync(sqlPath, "utf8");
  const { rows } = await db.pool.query(queryText, [eventId, limit]);
  return rows;
}

/**
 * Opprett transaksjon med volum, kurtasje og house-factor justering
 */
// server/repo/transactions.repo.ts
export async function createTransaction(t) {
  const now = new Date().toISOString();

  const price =
    t.price_client !== undefined && t.price_client !== null
      ? Number(t.price_client)
      : t.unit_price !== undefined && t.unit_price !== null
        ? Number(t.unit_price)
        : 0;

  const tx: Tx = {
    ...t,
    id: crypto.randomUUID(),
    created_at: now,
    unit_price: price,
  };

  console.log(
    "[TX] inserting",
    tx.event_beer_id,
    tx.qty,
    "×",
    tx.unit_price,
    "NOK",
  );

  if (db.kind === "memory") {
    db.mem.transactions.unshift(tx);
    return tx;
  }
  if (db.kind === "sqlite") {
    db.sql
      .prepare(
        `
      INSERT INTO "transaction" (id,event_id,event_beer_id,customer_id,qty,volume_ml,unit_price,created_at)
      VALUES (?,?,?,?,?,?,?,?)
    `,
      )
      .run(
        tx.id,
        tx.event_id,
        tx.event_beer_id,
        tx.customer_id,
        tx.qty,
        t.volume_ml ?? 500,
        tx.unit_price,
        tx.created_at,
      );
    return tx;
  }
  await db.pool.query(
    `
      INSERT INTO "transaction" (id,event_id,event_beer_id,customer_id,qty,volume_ml,unit_price,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      tx.id,
      tx.event_id,
      tx.event_beer_id,
      tx.customer_id,
      tx.qty,
      t.volume_ml ?? 500,
      tx.unit_price,
      tx.created_at,
    ],
  );
  return tx;
}
