// server/repo/priceUpdates.repo.ts
import db from "../db/index.js";
import fs from "node:fs";
import path from "node:path";

/**
 * listPriceHistory(eventId, eventBeerId, since)
 * Returnerer pris-historikk fra PriceUpdate-tabellen + current_price
 */
export async function listPriceHistory(
  eventId: string,
  eventBeerId: string,
  since?: Date | null,
): Promise<{ ts: string; price: number }[]> {
  if (db.kind === "memory") {
    const updates = db.mem.priceUpdates
      .filter((u) => u.event_beer_id === eventBeerId)
      .sort((a, b) => (a.updated_at ?? "").localeCompare(b.updated_at ?? ""));

    const filtered = since
      ? updates.filter((u) => new Date(u.updated_at) >= since)
      : updates;

    const current = db.mem.eventBeers.find((b) => b.id === eventBeerId);
    const points = filtered.map((u) => ({
      ts: u.updated_at,
      price: Number(u.new_price),
    }));

    if (current?.current_price != null) {
      points.push({
        ts: new Date().toISOString(),
        price: Number(current.current_price),
      });
    }

    return points;
  }

  // For sqlite/pg bruker vi ekstern SQL-fil
  const sqlPath = path.join(
    process.cwd(),
    "server",
    "sql",
    "listPriceHistory.sql",
  );
  const queryText = fs.readFileSync(sqlPath, "utf8");

  const params: any[] = [eventBeerId];
  if (since) params.push(since.toISOString());

  let rows: any[] = [];

  const { rows: pgRows } = await db.pool.query(queryText, params);
  const { rows: cur } = await db.pool.query(
    `SELECT current_price FROM event_beer WHERE id=$1`,
    [eventBeerId],
  );
  const result = pgRows.map((r) => ({
    ts: r.ts,
    price: Number(r.price ?? r.new_price),
  }));

  if (cur[0]?.current_price != null) {
    result.push({
      ts: new Date().toISOString(),
      price: Number(cur[0].current_price),
    });
  }

  return result;
}
export async function insertPriceUpdate(
  eventBeerId: string,
  oldPrice: number | null,
  newPrice: number,
) {
  const row = {
    id: crypto.randomUUID(),
    event_beer_id: eventBeerId,
    old_price: oldPrice,
    new_price: newPrice,
    updated_at: new Date().toISOString(),
  };

  if (db.kind === "memory") {
    db.mem.priceUpdates.push(row);
    return row;
  }

  await db.pool.query(
    `INSERT INTO "PriceUpdate" (id, event_beer_id, old_price, new_price, updated_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [row.id, row.event_beer_id, row.old_price, row.new_price, row.updated_at],
  );
  return row;
}

/**
 * Finn pris for et øl én time tilbake, og nåværende pris.
 * Håndterer tilfeller hvor siste update var tidligere enn timegrensen.
 */
export async function listRecentPriceForBeer(eventBeerId: string, since: Date) {
  let updates: any[] = [];

  if (db.kind === "memory") {
    updates = db.mem.priceUpdates
      .filter((u) => u.event_beer_id === eventBeerId)
      .sort((a, b) => (a.updated_at ?? "").localeCompare(b.updated_at ?? ""));
  } else if (db.kind === "sqlite") {
    updates = db.sql
      .prepare(
        `SELECT new_price AS price, updated_at AS ts
         FROM "PriceUpdate"
         WHERE event_beer_id = ?
         ORDER BY datetime(updated_at) ASC`,
      )
      .all(eventBeerId);
  } else {
    const { rows } = await db.pool.query(
      `SELECT new_price AS price, updated_at AS ts
       FROM "PriceUpdate"
       WHERE event_beer_id = $1
       ORDER BY updated_at ASC`,
      [eventBeerId],
    );
    updates = rows;
  }

  console.log("Updates for beer", eventBeerId, updates);
  if (!updates.length) return { oldPrice: null, newPrice: null };

  const oneHourAgo = since;

  // 🔧 normalize price + ts across db kinds
  const normalized = updates.map((u) => ({
    ts: u.ts ?? u.updated_at,
    price: u.price ?? u.new_price ?? u.old_price ?? null,
  }));

  const current = normalized[normalized.length - 1];
  const newPrice = Number(current.price);

  let oldPrice = Number(normalized[0].price);
  for (const u of normalized) {
    const t = new Date(u.ts);
    if (t <= oneHourAgo) oldPrice = Number(u.price);
    else break;
  }

  console.log(
    `For beer ${eventBeerId}, oldPrice: ${oldPrice}, newPrice: ${newPrice}`,
  );
  return { oldPrice, newPrice };
}
