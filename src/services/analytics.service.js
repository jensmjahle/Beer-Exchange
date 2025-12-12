import api from "@/config/axiosConfig.js";

const BASE = "/api";

// range: '1h' | '3h' | 'day' | 'all'
export async function getBeerPriceHistory(eventId, beerId, range = "day") {
  const { data } = await api.get(
    `${BASE}/analytics/event/${encodeURIComponent(eventId)}/beer/${encodeURIComponent(beerId)}/price-history`,
    {
      params: { range },
    }
  );
  return data;
}

export async function getBeerStats(eventId, beerId) {
  const { data } = await api.get(
    `${BASE}/analytics/event/${encodeURIComponent(eventId)}/beer/${encodeURIComponent(beerId)}/stats`
  );
  return data;
}
