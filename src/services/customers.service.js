const BASE = '/api/customers'

// GET /api/customers/event/:eventId
export async function listEventCustomers(eventId) {
  const res = await fetch(`${BASE}/event/${encodeURIComponent(eventId)}`)
  if (!res.ok) throw new Error('Failed to load customers')
  return res.json()
}

// POST /api/customers
export async function createCustomer({ eventId, name, phone = null }) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, name, phone }),
  })
  if (!res.ok) throw new Error('Failed to create customer')
  return res.json()
}
