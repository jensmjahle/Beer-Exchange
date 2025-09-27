const BASE = '/api'

async function parse(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const j = await res.json(); if (j?.error) msg = j.error } catch {}
    throw new Error(msg)
  }
  try { return await res.json() } catch { return null }
}

// range: '1h' | '3h' | 'day' | 'all'
export async function getBeerPriceHistory(eventId, eventBeerId, range = 'day') {
  const res = await fetch(`${BASE}/analytics/event/${encodeURIComponent(eventId)}/beer/${encodeURIComponent(eventBeerId)}/price-history?range=${encodeURIComponent(range)}`)
  return parse(res)
}

export async function getBeerStats(eventId, eventBeerId) {
  const res = await fetch(`${BASE}/analytics/event/${encodeURIComponent(eventId)}/beer/${encodeURIComponent(eventBeerId)}/stats`)
  return parse(res)
}
