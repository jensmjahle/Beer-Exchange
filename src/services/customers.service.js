import api from "@/config/axiosConfig.js";

const BASE = "/api/customers";

export async function listCustomers(eventId) {
  const { data } = await api.get(`${BASE}/event/${encodeURIComponent(eventId)}`);
  return data;
}

export async function listCustomersWithStats(eventId) {
  const { data } = await api.get(
    `${BASE}/event/${encodeURIComponent(eventId)}/stats`
  );
  return data;
}

export async function getCustomerDetails(eventId, customerId) {
  const { data } = await api.get(
    `${BASE}/${encodeURIComponent(customerId)}/event/${encodeURIComponent(eventId)}`
  );
  return data;
}

export async function listEventCustomers(eventId) {
  const { data } = await api.get(`${BASE}/event/${encodeURIComponent(eventId)}`);
  return data;
}

export async function createCustomer(eventId, formData) {
  const { data } = await api.post(
    `${BASE}/event/${encodeURIComponent(eventId)}`,
    formData
  );
  return data;
}

export async function updateCustomer(customerId, eventId, formData) {
  const { data } = await api.put(
    `${BASE}/${encodeURIComponent(customerId)}/event/${encodeURIComponent(eventId)}`,
    formData
  );
  return data;
}
