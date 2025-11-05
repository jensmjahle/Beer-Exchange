// src/services/customers.service.js
import { authedFetch } from "./authService";

const BASE = "/api/customers";

export async function listCustomers(eventId) {
  const res = await authedFetch(`${BASE}/event/${eventId}`);
  if (!res.ok) throw new Error("Failed to list customers");
  return res.json();
}

export async function listCustomersWithStats(eventId) {
  const res = await authedFetch(`${BASE}/event/${eventId}/stats`);
  if (!res.ok) throw new Error("Failed to list customers with stats");
  return res.json();
}
export async function getCustomerDetails(eventId, customerId) {
  const res = await authedFetch(
    `/api/customers/${customerId}/event/${eventId}`,
  );
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

const API = "/api/customers";

export async function listEventCustomers(eventId) {
  const res = await authedFetch(`${API}/event/${eventId}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
export async function createCustomer(eventId, formData) {
  const res = await fetch(`/api/customers/event/${eventId}`, {
    method: "POST",
    body: formData, // ← FormData directly
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create customer");
  }

  return await res.json();
}

export async function updateCustomer(customerId, eventId, formData) {
  const res = await fetch(`/api/customers/${customerId}/event/${eventId}`, {
    method: "PUT",
    body: formData, // ← same here
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update customer");
  }

  return await res.json();
}
