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

export async function listEventCustomersWithStats(eventId) {
  const res = await fetch(`${BASE}/customers/event/${encodeURIComponent(eventId)}/with-stats`)
  return parse(res)
}

export async function createCustomer(eventId, payload) {
  const res = await authedFetch(`${BASE}/customers/event/${encodeURIComponent(eventId)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  })
  return parse(res)
}

export async function getCustomerDetails(customerId, eventId) {
  const res = await fetch(`${BASE}/customers/${encodeURIComponent(customerId)}/details?eventId=${encodeURIComponent(eventId)}`)
  return parse(res)
}
