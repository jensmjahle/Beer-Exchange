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

/**
 * createTransaction({
 *   event_id,
 *   event_beer_id?: string|null,
 *   customer_id?: string|null,
 *   qty: number,
 *   unit_price: number
 * })
 */
export async function createTransaction(payload) {
  const res = await authedFetch(`${BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parse(res)
}
