import { Router } from 'express'
import { listTransactions, createTransaction } from '../repo/transactions.repo.js'

export const transactions = Router()

transactions.get('/event/:eventId', async (req, res) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 100)))
  res.json(await listTransactions(req.params.eventId, limit))
})

transactions.post('/', async (req, res) => {
  const { event_id, event_beer_id=null, customer_id=null, qty=1, unit_price=15 } = req.body || {}
  if (!event_id) return res.status(400).json({ error: 'event_id required' })
  const tx = await createTransaction({
    event_id: String(event_id),
    event_beer_id: event_beer_id ? String(event_beer_id) : null,
    customer_id: customer_id ? String(customer_id) : null,
    qty: Number(qty),
    unit_price: Number(unit_price),
  })
  res.json(tx)
})
