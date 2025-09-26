import { Router } from 'express'
import { listCustomers, createCustomer } from '../repo/customers.repo.js'

export const customers = Router()

customers.get('/event/:eventId', async (req, res) => {
  res.json(await listCustomers(req.params.eventId))
})

customers.post('/event/:eventId', async (req, res) => {
  const { name, phone } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  const c = await createCustomer(req.params.eventId, String(name), phone ? String(phone) : null)
  res.json(c)
})
