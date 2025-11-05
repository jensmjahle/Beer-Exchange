// server/repo/beers.repo.ts
import crypto from "node:crypto";
import db, { EventBeer } from "../db/index.js";
import { listRecentPriceForBeer } from "./priceUpdate.repo.js";

export async function listEventBeers(eventId: string): Promise<any[]> {
  let beers: any[] = [];

  if (db.kind === "memory") {
    beers = db.mem.eventBeers
      .filter((b) => b.event_id === eventId)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  } else {
    const { rows } = await db.query("beers/listEventBeers.sql", [eventId]);
    beers = rows;
  }

  // --- legg til prisendring siste time ---
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const enriched: any[] = [];
  for (const b of beers) {
    const recent = await listRecentPriceForBeer(b.id, oneHourAgo);
    const oldPrice = recent?.old_price ?? null;
    const newPrice = recent?.new_price ?? b.current_price ?? null;

    let changePct: number | null = null;
    if (oldPrice != null && newPrice != null && oldPrice > 0) {
      changePct = ((newPrice - oldPrice) / oldPrice) * 100;
    }

    enriched.push({
      ...b,
      last_hours_change:
        changePct != null ? Number(changePct.toFixed(1)) : null,
    });
  }

  return enriched;
}

export async function attachBeerToEvent(
  eventId: string,
  p: Omit<EventBeer, "id" | "event_id"> & {
    volumes?: { volume_ml: number; price_factor?: number }[];
  },
): Promise<EventBeer> {
  const b: EventBeer = {
    ...p,
    id: crypto.randomUUID(),
    event_id: eventId,
  };

  const priceUpdate = {
    id: crypto.randomUUID(),
    event_beer_id: b.id,
    old_price: null,
    new_price: b.current_price,
    updated_at: new Date().toISOString(),
  };

  if (db.kind === "memory") {
    db.mem.eventBeers.push(b);
    db.mem.priceUpdates.push(priceUpdate);
    return b;
  }

  const vals = [
    b.id,
    b.event_id,
    b.name,
    b.brewery,
    b.style,
    b.abv,
    b.ibu,
    b.description,
    b.image_url,
    b.base_price,
    b.min_price,
    b.max_price,
    b.current_price,
    b.position,
    b.active,
    JSON.stringify(p.volumes ?? []),
  ];

  await db.query("beers/insertEventBeer.sql", vals);
  return b;
}
