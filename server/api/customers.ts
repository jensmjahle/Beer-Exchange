import { Router } from 'express'
import {
  listCustomers,
  createCustomer,
  listCustomersWithStats,
  getCustomerDetails
} from '../repo/customers.repo.js'

export const customers = Router()

// Basic list
customers.get('/event/:eventId', async (req, res) => {
  res.json(await listCustomers(req.params.eventId))
})

// Create
customers.post('/event/:eventId', async (req, res) => {
  const { name, phone } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  const c = await createCustomer(req.params.eventId, String(name), phone ? String(phone) : null)
  res.json(c)
})

// Aggregated list with stats (tab, beers)
customers.get('/event/:eventId/with-stats', async (req, res) => {
  try {
    const rows = await listCustomersWithStats(req.params.eventId)
    res.json(rows)
  } catch (e) {
    console.error('[customers:with-stats] failed', e)
    res.status(500).json({ error: 'Failed to list customers with stats' })
  }
})

// Customer details inside an event (summary + transactions)
customers.get('/:customerId/details', async (req, res) => {
  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'eventId required' })
  try {
    const data = await getCustomerDetails(req.params.customerId, eventId)
    if (!data.customer) return res.status(404).json({ error: 'Customer not found' })
    res.json(data)
  } catch (e) {
    console.error('[customers:details] failed', e)
    res.status(500).json({ error: 'Failed to load customer details' })
  }
})
