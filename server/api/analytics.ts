// server/api/analytics.ts
import { Router } from "express";
import db from "../db/index.js";
import { listPriceUpdates } from "../repo/priceUpdate.repo.js";
import { getBeerStats } from "../repo/analytics.repo";

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

// ✅ GET /api/analytics/event/:eventId/beer/:eventBeerId/price-history
analytics.get(
  "/event/:eventId/beer/:beerId/price-history",
  async (req, res) => {
    const { beerId } = req.params;
    const range = String(req.query.range || "day");
    const since = sinceFromRange(range);

    try {
      const updates = await listPriceUpdates(beerId);
      const filtered = since
        ? updates.filter((u) => new Date(u.updated_at) >= since)
        : updates;

      const points = filtered.map((u) => ({
        // 🧠 Bruk updated_at fra databasen
        ts: u.updated_at,
        price: Number(u.new_price),
      }));

      // Legg til nåværende pris på slutten
      if (db.kind !== "memory") {
        const { rows } = await db.query(
          `SELECT current_price FROM event_beer WHERE id=$1`,
          [beerId],
        );
        if (rows[0]?.current_price != null) {
          points.push({
            ts: new Date().toISOString(),
            price: Number(rows[0].current_price),
          });
        }
      } else {
        const current = db.mem.eventBeers.find((b) => b.id === beerId);
        if (current?.current_price) {
          points.push({
            ts: new Date().toISOString(),
            price: Number(current.current_price),
          });
        }
      }

      return res.json(points);
    } catch (e) {
      console.error("[analytics:price-history] failed", e);
      return res.status(500).json({ error: "Failed to get price history" });
    }
  },
);

analytics.get("/event/:eventId/beer/:beerId/stats", async (req, res) => {
  const { eventId, beerId } = req.params;
  try {
    const stats = await getBeerStats(eventId, beerId);
    return res.json(stats);
  } catch (e) {
    console.error("[analytics:stats] failed", e);
    return res.status(500).json({ error: "Failed to get stats" });
  }
});
