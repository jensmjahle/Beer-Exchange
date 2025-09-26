const BASE = '/api/beers'

export async function listEventBeers(eventId) {
  const res = await fetch(`${BASE}/event/${encodeURIComponent(eventId)}`)
  if (!res.ok) throw new Error('Failed to load beers')
  return res.json()
}

export async function attachBeerToEvent(eventId, { beer_id, base_price, min_price, max_price, position = 0, active = 1 }) {
  const res = await fetch(`${BASE}/event/${encodeURIComponent(eventId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ beer_id, base_price, min_price, max_price, position, active }),
  })
  if (!res.ok) throw new Error('Failed to attach beer')
  return res.json()
}
