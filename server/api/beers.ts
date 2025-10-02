import { Router } from 'express'
import { attachBeerToEvent, listEventBeers } from '../repo/beers.repo.js'

export const beers = Router()

// list event beers
beers.get('/event/:eventId', async (req, res) => {
  try {
    const rows = await listEventBeers(req.params.eventId)
    res.json(rows)
  } catch (e) {
    console.error('[beers:list] failed', e)
    res.status(500).json({ error: 'Failed to list beers' })
  }
})

// attach new beer to event
beers.post('/event/:eventId', async (req, res) => {
  try {
    const {
      beer_id,
      name = null,
      volume_ml = null,
      abv = null,
      description = null,
      brewery = null,
      style = null,
      ibu = null,
      image_url = null,
      base_price,
      min_price,
      max_price,
      current_price,
      position = 0,
      active = 1,
    } = req.body || {}

    if (!beer_id) return res.status(400).json({ error: 'beer_id required' })
    if (base_price == null || min_price == null || max_price == null || current_price == null) {
      return res.status(400).json({ error: 'pricing fields required' })
    }

    const row = await attachBeerToEvent(req.params.eventId, {
      beer_id,
      name,
      volume_ml,
      abv,
      description,
      brewery,
      style,
      ibu,
      image_url,
      base_price,
      min_price,
      max_price,
      current_price,
      position,
      active,
    })

    res.json(row)
  } catch (e) {
    console.error('[beers:attach] failed', e)
    res.status(500).json({ error: 'Failed to attach beer to event' })
  }
})
