const BASE = '/api/beers'

export async function listEventBeers(eventId) {
  const res = await fetch(`${BASE}/event/${encodeURIComponent(eventId)}`)
  if (!res.ok) throw new Error('Failed to load beers for event')
  return res.json()
}

/** optional: add to catalog or attach beer to event if you use these */
export async function addCatalogBeer(payload) {
  const res = await fetch(`${BASE}/catalog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to add beer to catalog')
  return res.json()
}

export async function attachBeerToEvent(eventId, payload) {
  const res = await fetch(`${BASE}/event/${encodeURIComponent(eventId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to attach beer to event')
  return res.json()
}
