// server/api/beers.ts
import { Router } from 'express'
import crypto from 'node:crypto'

export const beers = Router()

// In-memory "catalog" and event attachments
type CatalogBeer = { id: string; name: string; abv?: number | null; volume_ml?: number | null }
type EventBeer = {
  id: string
  event_id: string
  beer_id: string
  name?: string // convenience for UI
  base_price: number
  min_price: number
  max_price: number
  current_price: number
  position: number
  active: 0 | 1
}

const catalog: CatalogBeer[] = [
  { id: 'cat-ipa', name: 'Hoppy IPA', abv: 6.0, volume_ml: 500 },
  { id: 'cat-lager', name: 'Crisp Lager', abv: 4.7, volume_ml: 500 },
]
const eventBeers: EventBeer[] = []

// GET /api/beers/catalog  (optional, useful for dropdowns)
beers.get('/catalog', (_req, res) => {
  res.json(catalog)
})

// GET /api/beers/event/:eventId  -> list beers for event
beers.get('/event/:eventId', (req, res) => {
  const { eventId } = req.params
  const rows = eventBeers
    .filter(b => b.event_id === eventId)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
    .map(b => ({
      ...b,
      name: b.name || catalog.find(c => c.id === b.beer_id)?.name || b.beer_id,
    }))
  res.json(rows)
})

// POST /api/beers/event/:eventId  -> attach beer to event
beers.post('/event/:eventId', (req, res) => {
  const { eventId } = req.params
  const { beer_id, base_price, min_price, max_price, position = 0, active = 1 } = req.body || {}
  if (!beer_id || base_price == null || min_price == null || max_price == null) {
    return res.status(400).json({ error: 'beer_id, base_price, min_price, max_price required' })
  }
  const id = crypto.randomUUID()
  const name = catalog.find(c => c.id === beer_id)?.name
  const row: EventBeer = {
    id,
    event_id: eventId,
    beer_id,
    name,
    base_price: Number(base_price),
    min_price: Number(min_price),
    max_price: Number(max_price),
    current_price: Number(base_price),
    position: Number(position) || 0,
    active: active ? 1 : 0,
  }
  eventBeers.push(row)
  res.json({ id, event_id: eventId })
})
