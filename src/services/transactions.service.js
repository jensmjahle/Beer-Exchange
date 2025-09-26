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

export async function listEventTransactions(eventId, { limit = 200 } = {}) {
  const res = await fetch(`${BASE}/transactions/event/${encodeURIComponent(eventId)}?limit=${limit}`)
  return parse(res)
}

// Server will compute unit_price from current beer price — we do NOT send it.
export async function createTransaction({ event_id, event_beer_id, customer_id = null, qty = 1 }) {
  const res = await authedFetch(`${BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id, event_beer_id, customer_id, qty }),
  })
  return parse(res)
}
