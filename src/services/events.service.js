const BASE = '/api/events'

export async function listEvents() {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('Failed to load events')
  return res.json()
}

export async function createEvent(payload = {}) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function getEvent(eventId) {
  const res = await fetch(`${BASE}/${encodeURIComponent(eventId)}`)
  if (!res.ok) throw new Error('Event not found')
  return res.json()
}

export async function createEventMultipart(formData) {
  const res = await fetch(BASE, {
    method: 'POST',
    body: formData, // browser sets multipart/form-data with boundary
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}
