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

export async function listEventBeers(eventId) {
  const res = await fetch(`${BASE}/beers/event/${encodeURIComponent(eventId)}`)
  return parse(res)
}

/**
 * payload = {
 *   beer_id: string,
 *   name?: string|null,
 *   base_price: number,
 *   min_price: number,
 *   max_price: number,
 *   current_price?: number, // defaults to base_price if omitted
 *   position?: number,
 *   active?: 0|1|boolean
 * }
 */
export async function attachBeerToEvent(eventId, payload) {
  const body = JSON.stringify(payload)
  const res = await authedFetch(`${BASE}/beers/event/${encodeURIComponent(eventId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  return parse(res)
}
