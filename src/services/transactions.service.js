// src/services/transactions.service.js
import { authedFetch } from './authService'

const BASE = '/api/transactions'

export async function listTransactions(eventId, limit = 100) {
  const res = await authedFetch(`${BASE}/event/${eventId}?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}

/**
 * createTransaction
 * @param {Object} opts
 * @param {string} opts.event_id
 * @param {string} opts.event_beer_id
 * @param {string} [opts.customer_id]
 * @param {number} [opts.qty]
 * @param {number} [opts.volume_ml] – optional, e.g. 330 or 500
 */
export async function createTransaction(opts) {
  const body = {
    event_id: opts.event_id,
    event_beer_id: opts.event_beer_id,
    customer_id: opts.customer_id || null,
    qty: opts.qty ?? 1,
    volume_ml: opts.volume_ml || null,
  }

  const res = await authedFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Transaction failed: ${err}`)
  }
  return res.json()
}
