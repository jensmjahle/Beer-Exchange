// server/api/beers.ts
import { Router } from "express";
import { attachBeerToEvent, listEventBeers } from "../repo/beers.repo.js";

export const beers = Router();

// Hent alle øl for et event
beers.get("/event/:eventId", async (req, res) => {
  try {
    const rows = await listEventBeers(req.params.eventId);
    res.json(rows);
  } catch (e) {
    console.error("[beers:list] failed", e);
    res.status(500).json({ error: "Failed to list beers" });
  }
});

// Legg til ny øl direkte som event_beer
beers.post("/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      name,
      brewery,
      style,
      abv,
      description,
      ibu,
      image_url,
      base_price,
      min_price,
      max_price,
      current_price,
      position = 0,
      active = 1,
      volumes = [],
    } = req.body || {};

    if (!name) return res.status(400).json({ error: "name required" });
    if (
      base_price == null ||
      min_price == null ||
      max_price == null ||
      current_price == null
    )
      return res.status(400).json({ error: "pricing fields required" });

    const beer = await attachBeerToEvent(eventId, {
      name,
      brewery,
      style,
      abv,
      description,
      ibu,
      image_url,
      base_price,
      min_price,
      max_price,
      current_price,
      position,
      active,
      volumes,
    });

    res.json(beer);
  } catch (e) {
    console.error("[beers:attach] failed", e);
    res.status(500).json({ error: "Failed to attach beer" });
  }
});
