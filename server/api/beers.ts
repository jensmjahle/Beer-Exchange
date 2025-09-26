import { Router } from 'express'
import { listEventBeers, attachBeerToEvent } from '../repo/beers.repo.js'

export const beers = Router()

beers.get('/event/:eventId', async (req, res) => {
  res.json(await listEventBeers(req.params.eventId))
})

beers.post('/event/:eventId', async (req, res) => {
  const { beer_id, name=null, base_price, min_price, max_price, current_price, position=0, active=1 } = req.body || {}
  if (!beer_id || base_price==null || min_price==null || max_price==null) {
    return res.status(400).json({ error: 'beer_id, base_price, min_price, max_price required' })
  }
  const b = await attachBeerToEvent(req.params.eventId, {
    beer_id: String(beer_id),
    name: name ? String(name) : null,
    base_price: Number(base_price),
    min_price: Number(min_price),
    max_price: Number(max_price),
    current_price: Number(current_price ?? base_price),
    position: Number(position) || 0,
    active: active ? 1 : 0,
    id: '' as any, event_id: '' as any, // ignored by repo
  } as any)
  res.json(b)
})
