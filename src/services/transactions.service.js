// src/services/transactions.service.js
import { authedFetch } from "./authService";
import api from "@/config/axiosConfig.js";

const BASE = "/api/transactions";

export async function listTransactions(eventId, limit = 100) {
  const res = await authedFetch(`${BASE}/event/${eventId}?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(data) {
  console.log("[TX:SERVICE] Sending transaction payload:", data);

  const res = await api.post(BASE, data, {
    headers: { "Content-Type": "application/json" },
  });

  console.log("[TX:SERVICE] Response:", res.data);
  return res.data;
}
