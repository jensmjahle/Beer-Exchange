import db from "../db/index.js";

export async function getBeerStats(eventId: string, eventBeerId: string) {
  const { rows } = await db.query("analytics/getBeerStats.sql", [
    eventId,
    eventBeerId,
  ]);
  const stats = rows[0];

  // Hent event_beer info for å supplere
  const { rows: ebRows } = await db.query(
    `SELECT name, description, brewery, style, abv, ibu, image_url, volumes, min_price, max_price, current_price, base_price FROM event_beer WHERE id=$1 AND event_id=$2`,
    [eventBeerId, eventId],
  );
  const eb = ebRows[0] ?? {};

  return {
    id: eventBeerId,
    name: eb.name ?? null,
    description: eb.description ?? null,
    brewery: eb.brewery ?? null,
    style: eb.style ?? null,
    abv: Number(eb.abv ?? 0),
    ibu: Number(eb.ibu ?? 0),
    image_url: eb.image_url ?? null,
    volumes: eb.volumes ?? [],
    min_price: Number(eb.min_price ?? 0),
    max_price: Number(eb.max_price ?? 0),
    current_price: Number(eb.current_price ?? eb.base_price ?? 0),
    total_sold: Number(stats.total_sold ?? 0),
    avg_price: Number(stats.avg_price ?? 0),
    ath: Number(stats.ath ?? 0),
    atl: Number(stats.atl ?? 0),
    first_ts: stats.first_ts,
    last_ts: stats.last_ts,
    best_trade: stats.best_trade,
    worst_trade: stats.worst_trade,
    top_customers: stats.top_customers ?? [],
    recent_trades: stats.recent_trades ?? [],
  };
}
