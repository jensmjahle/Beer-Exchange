
const BASE = '/api/transactions'

export async function listEventTransactions(eventId, { limit = 100 } = {}) {
  const url = new URL(`${BASE}/event/${encodeURIComponent(eventId)}`, window.location.origin)
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString().replace(window.location.origin, ''))
  if (!res.ok) throw new Error('Failed to load transactions')
  return res.json()
}
