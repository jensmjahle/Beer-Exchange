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
      updated_at,
    };
    db.mem.priceUpdates.push(rec);
    return rec;
  }

  const params = [id, eventBeerId, oldPrice, newPrice];
  const { rows } = await db.query("price_update/insertPriceUpdate.sql", params);
  return rows[0];
}
