import { v4 as uuid } from "uuid";
import db from "../db/index.js";

// 🔹 Henter alle prisoppdateringer for én øl
export async function listPriceUpdates(eventBeerId: string) {
  if (db.kind === "memory") {
    return db.mem.priceUpdates
      .filter((p) => p.event_beer_id === eventBeerId)
      .sort((a, b) => (a.updated_at ?? "").localeCompare(b.updated_at ?? ""));
  }

  const { rows } = await db.query("price_update/listPriceUpdates.sql", [
    eventBeerId,
  ]);
  return rows;
}

// 🔹 Henter kun siste prisoppdatering for en øl (for bruk i beers.repo)
export async function listRecentPriceForBeer(eventBeerId: string) {
  if (db.kind === "memory") {
    const arr = db.mem.priceUpdates
      .filter((p) => p.event_beer_id === eventBeerId)
      .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
    return arr[0] ?? null;
  }

  const { rows } = await db.query("price_update/listRecentPriceForBeer.sql", [
    eventBeerId,
  ]);
  return rows[0] ?? null;
}

// 🔹 Oppretter ny prisoppdatering
export async function insertPriceUpdate(
  eventBeerId: string,
  oldPrice: number,
  newPrice: number,
) {
  const id = uuid();
  const created_at = new Date().toISOString();

  if (db.kind === "memory") {
    const rec = {
      id,
      event_beer_id: eventBeerId,
      old_price: oldPrice,
      new_price: newPrice,
      updated_at: created_at,
    };
    db.mem.priceUpdates.push(rec);
    return rec;
  }

  const params = [id, eventBeerId, oldPrice, newPrice];
  const { rows } = await db.query("price_update/insertPriceUpdate.sql", params);
  return rows[0];
}
export async function getPriceWindowForBeer(
  eventBeerId: string,
  since: Date,
) {
  if (db.kind === "memory") {
    const updates = db.mem.priceUpdates
      .filter((p) => p.event_beer_id === eventBeerId)
      .sort((a, b) =>
        (a.updated_at ?? "").localeCompare(b.updated_at ?? ""),
      );

    if (!updates.length) {
      return { old_price: null, new_price: null };
    }

    // siste oppdatering = "nå"
    const latest = updates[updates.length - 1];

    // finn siste før cutoff
    const cutoffIso = since.toISOString();
    const before = [...updates]
      .filter((u) => u.updated_at && u.updated_at <= cutoffIso)
      .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))[0];

    return {
      old_price: before ? (before.new_price ?? before.old_price) : null,
      new_price: latest.new_price ?? latest.old_price ?? null,
      updated_at: latest.updated_at,
    };
  }

  // pg / sqlite-aktig adapter med .query(path, params)
  const { rows } = await db.query(
    "price_update/getPriceWindow.sql",
    [eventBeerId, since.toISOString()],
  );
  return rows[0] ?? { old_price: null, new_price: null };
}