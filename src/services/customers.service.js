import { authedFetch } from './authService'
const BASE = '/api'

async function parse(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); if (j?.error) msg = j.error } catch {}
    throw new Error(msg)
  }
  try { return await res.json() } catch { return null }
}

export async function listEventCustomers(eventId) {
  const res = await fetch(`${BASE}/customers/event/${encodeURIComponent(eventId)}`)
  return parse(res)
}

// createCustomer(eventId, { name, phone })
export async function createCustomer(eventId, { name, phone = null }) {
  const res = await authedFetch(`${BASE}/customers/event/${encodeURIComponent(eventId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone }),
  })
  return parse(res)
}
