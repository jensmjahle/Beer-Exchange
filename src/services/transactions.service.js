import api from "@/config/axiosConfig.js";

const BASE = "/api/transactions";

export async function listTransactions(eventId, limit = 100) {
  const { data } = await api.get(`${BASE}/event/${encodeURIComponent(eventId)}`, {
    params: { limit },
  });
  return data;
}

export async function createTransaction(payload) {
  console.log("[TX:SERVICE] Sending transaction payload:", payload);

  const { data } = await api.post(BASE, payload, {
    headers: { "Content-Type": "application/json" },
  });

  console.log("[TX:SERVICE] Response:", data);
  return data;
}
