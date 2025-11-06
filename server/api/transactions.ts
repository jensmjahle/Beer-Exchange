import { Router } from "express";
import {
  listTransactions,
  createTransaction,
} from "../repo/transactions.repo.js";
import { recalcPricesForEvent } from "../pricing.js";

export const transactions = Router();

transactions.get("/event/:eventId", async (req, res) => {
  try {
    // --- Trygt hent limit-parameter ---
    const limitParam = Number(req.query.limit);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 100;

    // --- Hent transaksjoner fra repo ---
    const rows = await listTransactions(req.params.eventId, limit);

    // --- Send resultatet ---
    res.json(rows);
  } catch (e) {
    console.error("[transactions:list] failed:", e);
    res.status(500).json({ error: "Failed to list transactions" });
  }
});

transactions.post("/", async (req, res) => {
  try {
    const {
      event_id,
      event_beer_id,
      customer_id = null,
      qty = 1,
      volume_ml = 500,
      price_client = 0,
      total_price = null,
    } = req.body || {};

    if (!event_id || !event_beer_id)
      return res
        .status(400)
        .json({ error: "event_id and event_beer_id required" });

    const parsedPrice = price_client ?? total_price ?? 0;

    const tx = await createTransaction({
      event_id,
      event_beer_id,
      customer_id,
      qty: Math.max(1, Number(qty)),
      volume_ml: Number(volume_ml),
      price_client: Number(parsedPrice),
    });

    await recalcPricesForEvent(event_id, event_beer_id, qty);

    const clients = globalThis.eventStreams?.get(event_id);
    if (clients) {
      for (const c of clients) {
        c.write(`event: priceUpdate\ndata: {"eventId":"${event_id}"}\n\n`);
        c.write(`event: transactionUpdate\ndata: ${JSON.stringify(tx)}\n\n`);
      }
    }

    res.json(tx);
  } catch (e) {
    console.error("[transactions:create] failed:", e);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

