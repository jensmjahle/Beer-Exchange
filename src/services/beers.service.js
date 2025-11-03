// src/services/beers.service.js
import { authedFetch } from "./authService";

const BASE = "/api/beers";

export async function listEventBeers(eventId) {
  const res = await authedFetch(`${BASE}/event/${eventId}`);
  if (!res.ok) throw new Error("Failed to list beers");
  return res.json();
}

/**
 * attachBeerToEvent
 * Nå kan du sende inn flere volumer:
 *  volumes: [{ volume_ml: 330 }, { volume_ml: 500 }]
 */
export async function attachBeerToEvent(eventId, beer) {
  const res = await authedFetch(`${BASE}/event/${eventId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(beer),
  });
  if (!res.ok) throw new Error("Failed to attach beer");
  return res.json();
}

export async function fetchBeersForEvent(eventId) {
  const res = await authedFetch(`${BASE}/event/${eventId}`);
  if (!res.ok) throw new Error("Kunne ikke hente øl for event");
  return res.json();
}
