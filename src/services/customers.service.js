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

export async function createCustomer(eventId, data) {
  const url = `/api/customers/event/${eventId}`

  let options = {}
  if (data instanceof FormData) {
    // multipart form upload
    options = {
      method: 'POST',
      body: data,
    }
  } else {
    // normal JSON
    options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  }

  const res = await fetch(url, options)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}


export async function getCustomerDetails(customerId, eventId) {
  const res = await fetch(`${BASE}/customers/${encodeURIComponent(customerId)}/details?eventId=${encodeURIComponent(eventId)}`)
  return parse(res)
}
