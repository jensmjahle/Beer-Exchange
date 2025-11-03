// server/api/transactions.ts
import { Router } from "express";
import db from "../db/index.js";
import {
  listTransactions,
  createTransaction,
  computeHouseFactor,
} from "../repo/transactions.repo.js";
import { recalcPricesForEvent } from "../pricing.js";

export const transactions = Router();

transactions.get("/event/:eventId", async (req, res) => {
  try {
    const rows = await listTransactions(
      req.params.eventId,
      Number(req.query.limit ?? 100),
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to list transactions" });
  }
});

transactions.get("/eventss/:eventId", async (req, res) => {
  const { eventId } = req.params;
  const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 100)));
  console.log(req.body);
  try {
    if (db.kind === "memory") {
      const raw = db.mem.transactions
        .filter((t) => t.event_id === eventId)
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .slice(0, limit);

      const byCustomer = new Map(db.mem.customers.map((c) => [c.id, c]));
      const byBeer = new Map(db.mem.eventBeers.map((b) => [b.id, b]));

      const rows = raw.map((t) => {
        const c = t.customer_id ? byCustomer.get(t.customer_id) : null;
        const b = t.event_beer_id ? byBeer.get(t.event_beer_id) : null;
        return {
          id: t.id,
          event_id: t.event_id,
          event_beer_id: t.event_beer_id,
          customer_id: t.customer_id,
          qty: t.qty,
          unit_price: t.unit_price,
          ts: t.created_at,
          customer_name: c?.name ?? null,
          beer_name: b?.name ?? null,
          beer_id: b?.beer_id ?? null,
        };
      });
      return res.json(rows);
    }

    if (db.kind === "sqlite") {
      const rows = db.sql
        .prepare(
          `
        SELECT
          t.id,
          t.event_id,
          t.event_beer_id,
          t.customer_id,
          t.qty,
          t.unit_price,
          t.created_at AS ts,
          c.name AS customer_name,
          eb.name AS beer_name,
          eb.beer_id AS beer_id
        FROM "transaction" t
        LEFT JOIN customer c   ON c.id = t.customer_id
        LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
        WHERE t.event_id = ?
        ORDER BY datetime(t.created_at) DESC
        LIMIT ?
      `,
        )
        .all(eventId, limit);
      return res.json(rows);
    }

    const { rows } = await db.pool.query(
      `
      SELECT
        t.id,
        t.event_id,
        t.event_beer_id,
        t.customer_id,
        t.qty,
        t.unit_price,
        t.created_at AS ts,
        c.name AS customer_name,
        eb.name AS beer_name,
        eb.beer_id AS beer_id
      FROM "transaction" t
      LEFT JOIN customer   c  ON c.id = t.customer_id
      LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
      WHERE t.event_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2
    `,
      [eventId, limit],
    );
    return res.json(rows);
  } catch (e) {
    console.error("[transactions:list] failed:", e);
    return res.status(500).json({ error: "Failed to list transactions" });
  }
});

transactions.post("/", async (req, res) => {
  // --- debug first ---
  console.log("[TX:create:req.body]", req.body);

  const {
    event_id,
    event_beer_id,
    customer_id = null,
    qty = 1,
    volume_ml = null,
    price_client = null,
    total_price = null, // optional alias
  } = req.body || {};

  if (!event_id || !event_beer_id) {
    return res
      .status(400)
      .json({ error: "event_id and event_beer_id required" });
  }

  // ✅ Coerce price_client explicitly (handles string or number)
  const parsedPrice =
    price_client !== undefined && price_client !== null
      ? parseFloat(price_client)
      : total_price !== undefined && total_price !== null
        ? parseFloat(total_price)
        : 0;

  try {
    const tx = await createTransaction({
      event_id: String(event_id),
      event_beer_id: String(event_beer_id),
      customer_id: customer_id ? String(customer_id) : null,
      qty: Math.max(1, Number(qty || 1)),
      volume_ml: Number(volume_ml ?? 500),
      price_client: parsedPrice,
    });

    await recalcPricesForEvent(
      String(event_id),
      String(event_beer_id),
      Math.max(1, Number(qty || 1)),
    );

    const clients = globalThis.eventStreams?.get(event_id);
    if (clients) {
      for (const resClient of clients) {
        resClient.write(
          `event: priceUpdate\ndata: {"eventId":"${event_id}"}\n\n`,
        );
        resClient.write(
          `event: transactionUpdate\ndata: ${JSON.stringify(tx)}\n\n`,
        );
      }
    }

    return res.json(tx);
  } catch (e) {
    console.error("[transactions:create] failed:", e);
    return res.status(500).json({ error: "Failed to create transaction" });
  }
});
