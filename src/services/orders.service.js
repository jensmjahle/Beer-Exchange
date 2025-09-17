const BASE = '/api/orders'

export async function createOrder({ eventId, tabId, eventBeerId, qty = 1 }) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, tabId, eventBeerId, qty }),
  })
  if (!res.ok) throw new Error('Failed to create order')
  return res.json()
}

export async function simulateVippsPaid(orderId) {
  const res = await fetch(`${BASE}/webhook/vipps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  })
  if (!res.ok) throw new Error('Webhook failed')
  return res.json()
}
