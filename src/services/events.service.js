import api from "@/config/axiosConfig.js";

const BASE = "/api";

export const listEvents = async () => {
  const { data } = await api.get(`${BASE}/events`);
  return data;
};

export async function getEvent(eventId) {
  const { data } = await api.get(
    `${BASE}/events/${encodeURIComponent(eventId)}`
  );
  return data;
}

export async function createEventMultipart(formData) {
  const { data } = await api.post(`${BASE}/events`, formData);
  return data;
}

export async function createEvent(payload) {
  const { data } = await api.post(`${BASE}/events`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}
