// src/services/leaderboard.service.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

/** 🔹 Fetch helper */
async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/** 🥇 Mest væske konsumert (liter) */
export async function getTopVolume(eventId) {
  if (!eventId) throw new Error("eventId required");
  return fetchJson(`${API_BASE}/leaderboard/event/${eventId}/top-volume`);
}

/** 💰 Høyest barregning (NOK) */
export async function getTopSpend(eventId) {
  if (!eventId) throw new Error("eventId required");
  return fetchJson(`${API_BASE}/leaderboard/event/${eventId}/top-spend`);
}

/** 🍻 Top fyllesvin (promille beregnet) */
export async function getTopBac(eventId) {
  if (!eventId) throw new Error("eventId required");
  return fetchJson(`${API_BASE}/leaderboard/event/${eventId}/top-bac`);
}

/** 🧩 Hent alle tre leaderboardene samtidig */
export async function getAllPodiums(eventId) {
  const [volume, spend, bac] = await Promise.all([
    getTopVolume(eventId),
    getTopSpend(eventId),
    getTopBac(eventId),
  ]);
  return { volume, spend, bac };
}
