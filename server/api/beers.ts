// server/api/beers.ts
import { Router } from 'express'
import db from '../db.js'
import { v4 as uuid } from 'uuid'

export const beers = Router()

// List beers (catalog)
beers.get('/catalog', async (_req, res) => {
  if (db.kind === 'sqlite') {
    const rows = db.sql.prepare(`SELECT * FROM beer ORDER BY name`).all()
    res.json(rows)
  } else {
    const { rows } = await db.pool.query(`SELECT * FROM beer ORDER BY name`)
    res.json(rows)
  }
})

// Add to catalog
beers.post('/catalog', async (req, res) => {
  const id = uuid()
  const { name, abv = null, volume_ml = null, meta_json = null } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })

  if (db.kind === 'sqlite') {
    db.sql.prepare(
      `INSERT INTO beer (id,name,abv,volume_ml,meta_json) VALUES (?,?,?,?,?)`
    ).run(id, name, abv, volume_ml, meta_json)
  } else {
    await db.pool.query(
      `INSERT INTO beer (id,name,abv,volume_ml,meta_json) VALUES ($1,$2,$3,$4,$5)`,
      [id, name, abv, volume_ml, meta_json]
    )
  }
  res.json({ id, name, abv, volume_ml, meta_json })
})

// List event beers with current price (what your UI needs)
beers.get('/event/:eventId', async (req, res) => {
  const { eventId } = req.params
  if (db.kind === 'sqlite') {
    const rows = db.sql.prepare(`
      SELECT eb.id, eb.beer_id, b.name, eb.base_price, eb.min_price, eb.max_price,
             eb.current_price, eb.position, eb.active
      FROM event_beer eb
      JOIN beer b ON b.id = eb.beer_id
      WHERE eb.event_id = ?
      ORDER BY eb.position, b.name
    `).all(eventId)
    res.json(rows)
  } else {
    const { rows } = await db.pool.query(`
      SELECT eb.id, eb.beer_id, b.name, eb.base_price, eb.min_price, eb.max_price,
             eb.current_price, eb.position, eb.active
      FROM event_beer eb
      JOIN beer b ON b.id = eb.beer_id
      WHERE eb.event_id = $1
      ORDER BY eb.position, b.name
    `, [eventId])
    res.json(rows)
  }
})

// Attach a beer to an event (with price bounds)
beers.post('/event/:eventId', async (req, res) => {
  const { eventId } = req.params
  const id = uuid()
  const { beer_id, base_price, min_price, max_price, position = 0, active = 1 } = req.body || {}
  if (!beer_id || base_price == null || min_price == null || max_price == null) {
    return res.status(400).json({ error: 'beer_id, base_price, min_price, max_price required' })
  }
  if (db.kind === 'sqlite') {
    db.sql.prepare(`
      INSERT INTO event_beer (id,event_id,beer_id,base_price,min_price,max_price,current_price,position,active)
      VALUES (?,?,?,?,?,?,?, ?, ?)
    `).run(id, eventId, beer_id, base_price, min_price, max_price, base_price, position, active)
  } else {
    await db.pool.query(`
      INSERT INTO event_beer (id,event_id,beer_id,base_price,min_price,max_price,current_price,position,active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [id, eventId, beer_id, base_price, min_price, max_price, base_price, position, active])
  }
  res.json({ id, event_id: eventId })
})
