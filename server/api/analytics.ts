// server/api/analytics.ts
import { Router } from "express";
import db from "../db/index.js";
import { listPriceHistory } from "../repo/priceUpdate.repo";

export const analytics = Router();

function sinceFromRange(range: string): Date | null {
  const now = new Date();
  if (range === "1h") return new Date(now.getTime() - 60 * 60 * 1000);
  if (range === "3h") return new Date(now.getTime() - 3 * 60 * 60 * 1000);
  if (range === "day") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null; // 'all'
}

// GET /api/analytics/event/:eventId/beer/:eventBeerId/price-history?range=1h|3h|day|all
analytics.get(
  "/event/:eventId/beerssssss/:eventBeerId/price-history",
  async (req, res) => {
    const { eventId, eventBeerId } = req.params;
    const range = String(req.query.range || "day");
    const since = sinceFromRange(range);

    try {
      let txs: any[] = [];
      let current: any;

      if (db.kind === "memory") {
        txs = db.mem.transactions
          .filter(
            (t) => t.event_id === eventId && t.event_beer_id === eventBeerId,
          )
          .sort((a, b) =>
            (a.created_at ?? "").localeCompare(b.created_at ?? ""),
          );
        if (since) txs = txs.filter((t) => new Date(t.created_at) >= since);
        current = db.mem.eventBeers.find((b) => b.id === eventBeerId);
      } else if (db.kind === "sqlite") {
        const base = `
        SELECT unit_price, created_at AS ts
        FROM "transaction"
        WHERE event_id = ? AND event_beer_id = ?
      `;
        const rows = since
          ? db.sql
              .prepare(
                `${base} AND datetime(created_at) >= datetime(?) ORDER BY datetime(created_at) ASC`,
              )
              .all(eventId, eventBeerId, since.toISOString())
          : db.sql
              .prepare(`${base} ORDER BY datetime(created_at) ASC`)
              .all(eventId, eventBeerId);
        txs = rows;
        current = db.sql
          .prepare(`SELECT current_price FROM event_beer WHERE id = ?`)
          .get(eventBeerId);
      } else {
        const base = `
        SELECT unit_price, created_at AS ts
        FROM "transaction"
        WHERE event_id = $1 AND event_beer_id = $2
      `;
        const params: any[] = [eventId, eventBeerId];
        const rows = since
          ? (
              await db.pool.query(
                `${base} AND created_at >= $3 ORDER BY created_at ASC`,
                [...params, since.toISOString()],
              )
            ).rows
          : (await db.pool.query(`${base} ORDER BY created_at ASC`, params))
              .rows;
        txs = rows;
        const { rows: cur } = await db.pool.query(
          `SELECT current_price FROM event_beer WHERE id=$1`,
          [eventBeerId],
        );
        current = cur[0];
      }

      const points = txs.map((t) => ({
        ts: t.ts ?? t.created_at,
        price: Number(t.unit_price),
      }));
      if (current?.current_price != null) {
        points.push({
          ts: new Date().toISOString(),
          price: Number(current.current_price),
        });
      }
      return res.json(points);
    } catch (e) {
      console.error("[analytics:price-history] failed", e);
      return res.status(500).json({ error: "Failed to get history" });
    }
  },
);
analytics.get(
  "/event/:eventId/beer/:eventBeerId/price-history",
  async (req, res) => {
    const { eventId, eventBeerId } = req.params;
    const range = String(req.query.range || "day");
    const since = sinceFromRange(range);

    try {
      const points = await listPriceHistory(eventId, eventBeerId, since);
      return res.json(points);
    } catch (e) {
      console.error("[analytics:price-history] failed", e);
      return res.status(500).json({ error: "Failed to get price history" });
    }
  },
);

// GET /api/analytics/event/:eventId/beer/:eventBeerId/stats
analytics.get("/event/:eventId/beer/:eventBeerId/stats", async (req, res) => {
  const { eventId, eventBeerId } = req.params;
  try {
    if (db.kind === "memory") {
      const eb = db.mem.eventBeers.find(
        (b) => b.id === eventBeerId && b.event_id === eventId,
      );
      if (!eb) return res.status(404).json({ error: "Beer not found" });
      const all = db.mem.transactions
        .filter(
          (t) => t.event_id === eventId && t.event_beer_id === eventBeerId,
        )
        .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
      const prices = [
        ...all.map((t) => Number(t.unit_price)),
        Number(eb.current_price ?? eb.base_price ?? 0),
      ].filter(Number.isFinite);
      const ath = prices.length ? Math.max(...prices) : null;
      const atl = prices.length ? Math.min(...prices) : null;

      const byCust = new Map(db.mem.customers.map((c) => [c.id, c]));
      const cheapest = all.length
        ? all.reduce(
            (m, t) => (!m || t.unit_price < m.unit_price ? t : m),
            null as any,
          )
        : null;
      const priciest = all.length
        ? all.reduce(
            (m, t) => (!m || t.unit_price > m.unit_price ? t : m),
            null as any,
          )
        : null;

      return res.json({
        name: eb.name ?? null,
        beer_id: eb.beer_id ?? null,
        description: eb.description ?? null,
        brewery: eb.brewery ?? null,
        style: eb.style ?? null,
        volume_ml: eb.volume_ml ?? null,
        abv: eb.abv ?? null,
        ibu: eb.ibu ?? null,
        image_url: eb.image_url ?? null,
        last_price: Number(eb.current_price ?? eb.base_price ?? 0),
        ath,
        atl,
        first_ts: all[0]?.created_at ?? null,
        last_ts: all[all.length - 1]?.created_at ?? null,
        cheapest: cheapest
          ? {
              customer_name:
                byCust.get(cheapest.customer_id || "")?.name ?? "Anonymous",
              unit_price: Number(cheapest.unit_price),
              qty: Number(cheapest.qty),
            }
          : null,
        priciest: priciest
          ? {
              customer_name:
                byCust.get(priciest.customer_id || "")?.name ?? "Anonymous",
              unit_price: Number(priciest.unit_price),
              qty: Number(priciest.qty),
            }
          : null,
      });
    }

    if (db.kind === "sqlite") {
      const eb = db.sql
        .prepare(
          `SELECT name, beer_id, current_price, base_price FROM event_beer WHERE id=? AND event_id=?`,
        )
        .get(eventBeerId, eventId);
      if (!eb) return res.status(404).json({ error: "Beer not found" });

      const txs = db.sql
        .prepare(
          `
        SELECT t.unit_price, t.qty, t.created_at, c.name AS customer_name
        FROM "transaction" t
        LEFT JOIN customer c ON c.id = t.customer_id
        WHERE t.event_id = ? AND t.event_beer_id = ?
        ORDER BY datetime(t.created_at) ASC
      `,
        )
        .all(eventId, eventBeerId);

      const prices = [
        ...txs.map((t) => Number(t.unit_price)),
        Number(eb.current_price ?? eb.base_price ?? 0),
      ].filter(Number.isFinite);
      const ath = prices.length ? Math.max(...prices) : null;
      const atl = prices.length ? Math.min(...prices) : null;

      let cheapest = null as any,
        priciest = null as any;
      for (const t of txs) {
        if (!cheapest || t.unit_price < cheapest.unit_price) cheapest = t;
        if (!priciest || t.unit_price > priciest.unit_price) priciest = t;
      }

      return res.json({
        name: eb.name ?? null,
        beer_id: eb.beer_id ?? null,
        last_price: Number(eb.current_price ?? eb.base_price ?? 0),
        ath,
        atl,
        first_ts: txs[0]?.created_at ?? null,
        last_ts: txs[txs.length - 1]?.created_at ?? null,
        cheapest: cheapest
          ? {
              customer_name: cheapest.customer_name ?? "Anonymous",
              unit_price: Number(cheapest.unit_price),
              qty: Number(cheapest.qty),
            }
          : null,
        priciest: priciest
          ? {
              customer_name: priciest.customer_name ?? "Anonymous",
              unit_price: Number(priciest.unit_price),
              qty: Number(priciest.qty),
            }
          : null,
      });
    }

    // pg
    const { rows: ebRows } = await db.pool.query(
      `SELECT name, beer_id, current_price, base_price FROM event_beer WHERE id=$1 AND event_id=$2`,
      [eventBeerId, eventId],
    );
    const eb = ebRows[0];
    if (!eb) return res.status(404).json({ error: "Beer not found" });

    const { rows: txs } = await db.pool.query(
      `
      SELECT t.unit_price, t.qty, t.created_at, c.name AS customer_name
      FROM "transaction" t
      LEFT JOIN customer c ON c.id = t.customer_id
      WHERE t.event_id = $1 AND t.event_beer_id = $2
      ORDER BY t.created_at ASC
    `,
      [eventId, eventBeerId],
    );

    const prices = [
      ...txs.map((t) => Number(t.unit_price)),
      Number(eb.current_price ?? eb.base_price ?? 0),
    ].filter(Number.isFinite);
    const ath = prices.length ? Math.max(...prices) : null;
    const atl = prices.length ? Math.min(...prices) : null;

    let cheapest: any = null,
      priciest: any = null;
    for (const t of txs) {
      if (!cheapest || t.unit_price < cheapest.unit_price) cheapest = t;
      if (!priciest || t.unit_price > priciest.unit_price) priciest = t;
    }

    return res.json({
      name: eb.name ?? null,
      beer_id: eb.beer_id ?? null,
      last_price: Number(eb.current_price ?? eb.base_price ?? 0),
      ath,
      atl,
      first_ts: txs[0]?.created_at ?? null,
      last_ts: txs[txs.length - 1]?.created_at ?? null,
      cheapest: cheapest
        ? {
            customer_name: cheapest.customer_name ?? "Anonymous",
            unit_price: Number(cheapest.unit_price),
            qty: Number(cheapest.qty),
          }
        : null,
      priciest: priciest
        ? {
            customer_name: priciest.customer_name ?? "Anonymous",
            unit_price: Number(priciest.unit_price),
            qty: Number(priciest.qty),
          }
        : null,
    });
  } catch (e) {
    console.error("[analytics:stats] failed", e);
    return res.status(500).json({ error: "Failed to get stats" });
  }
});
