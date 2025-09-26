// server/api/customers.ts
import { Router } from 'express'
import crypto from 'node:crypto'

export const customers = Router()

type Customer = { id: string; event_id: string; name: string; phone?: string | null }

const store: Customer[] = []

// GET /api/customers/event/:eventId
customers.get('/event/:eventId', (req, res) => {
  const { eventId } = req.params
  const rows = store.filter(c => c.event_id === eventId).sort((a, b) => a.name.localeCompare(b.name))
  res.json(rows)
})

// POST /api/customers   { eventId, name, phone? }
customers.post('/', (req, res) => {
  const { eventId, name, phone = null } = req.body || {}
  if (!eventId || !name) return res.status(400).json({ error: 'eventId & name required' })
  const id = crypto.randomUUID()
  const c: Customer = { id, event_id: String(eventId), name: String(name), phone: phone ? String(phone) : null }
  store.unshift(c)
  res.json(c)
})
