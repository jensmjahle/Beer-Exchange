import crypto from "node:crypto";
import db, { EventBeer } from "../db/index.js";

// Hent alle øl for et event
export async function listEventBeers(eventId: string): Promise<EventBeer[]> {
  if (db.kind === "memory")
    return db.mem.eventBeers
      .filter((b) => b.event_id === eventId)
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  if (db.kind === "sqlite")
    return db.sql
      .prepare(
        `SELECT * FROM event_beer WHERE event_id=? ORDER BY position, id`,
      )
      .all(eventId);

  const { rows } = await db.pool.query(
    `SELECT * FROM event_beer WHERE event_id=$1 ORDER BY position, id`,
    [eventId],
  );
  return rows;
}

// Opprett ny event_beer direkte
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
  }

  if (db.kind === "memory") {
    if (!db.mem.eventBeers) db.mem.eventBeers = [];
    db.mem.eventBeers.push(b);

    if (!db.mem.priceUpdates) db.mem.priceUpdates = [];
    db.mem.priceUpdates.push(priceUpdate);

    return b;
  }


  const cols = [
    "id",
    "event_id",
    "name",
    "brewery",
    "style",
    "abv",
    "description",
    "ibu",
    "image_url",
    "base_price",
    "min_price",
    "max_price",
    "current_price",
    "position",
    "active",
    "volumes",
  ];
  const vals = [
    b.id,
    b.event_id,
    b.name,
    b.brewery,
    b.style,
    b.abv,
    b.description,
    b.ibu,
    b.image_url,
    b.base_price,
    b.min_price,
    b.max_price,
    b.current_price,
    b.position,
    b.active,
    JSON.stringify(p.volumes ?? []),
  ];

  if (db.kind === "sqlite") {
    db.sql
      .prepare(
        `INSERT INTO event_beer (${cols.join(",")})
         VALUES (${cols.map(() => "?").join(",")})`,
      )
      .run(...vals);
    return b;
  }

  await db.pool.query(
    `INSERT INTO event_beer (${cols.join(",")})
     VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")})`,
    vals,
  );
  return b;
}
