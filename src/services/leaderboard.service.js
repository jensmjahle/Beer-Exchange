import api from "@/config/axiosConfig.js";

const BASE = "/api/leaderboard";

export async function getTopVolume(eventId) {
  if (!eventId) throw new Error("eventId required");
  const { data } = await api.get(
    `${BASE}/event/${encodeURIComponent(eventId)}/top-volume`
  );
  return data;
}

export async function getTopSpend(eventId) {
  if (!eventId) throw new Error("eventId required");
  const { data } = await api.get(
    `${BASE}/event/${encodeURIComponent(eventId)}/top-spend`
  );
  return data;
}

export async function getTopBac(eventId) {
  if (!eventId) throw new Error("eventId required");
  const { data } = await api.get(
    `${BASE}/event/${encodeURIComponent(eventId)}/top-bac`
  );
  return data;
}

export async function getAllPodiums(eventId) {
  const [volume, spend, bac] = await Promise.all([
    getTopVolume(eventId),
    getTopSpend(eventId),
    getTopBac(eventId),
  ]);
  return { volume, spend, bac };
}
