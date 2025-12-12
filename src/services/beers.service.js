import api from "@/config/axiosConfig.js";

const BASE = "/api/beers";

export async function listEventBeers(eventId) {
  const { data } = await api.get(`${BASE}/event/${encodeURIComponent(eventId)}`);
  return data;
}

export async function attachBeerToEvent(eventId, beer) {
  const { data } = await api.post(
    `${BASE}/event/${encodeURIComponent(eventId)}`,
    beer,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return data;
}

export async function fetchBeersForEvent(eventId) {
  const { data } = await api.get(`${BASE}/event/${encodeURIComponent(eventId)}`);
  return data;
}
