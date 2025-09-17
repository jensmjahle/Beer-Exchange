// server/api/tabs.ts
import { Router } from 'express'
import db from '../db.js'
import { v4 as uuid } from 'uuid'

export const tabs = Router()

// Create/open a tab for a customer in an event
tabs.post('/open', async (req, res) => {
  const { eventId, customerId, note = null } = req.body || {}
  if (!eventId || !customerId) return res.status(400).json({ error: 'eventId & customerId required' })
  const id = uuid()

  if (db.kind === 'sqlite') {
    db.sql.prepare(`
      INSERT INTO tab (id,event_id,customer_id,status,opened_at,note)
      VALUES (?,?,?,'open',datetime('now'),?)
    `).run(id, eventId, customerId, note)
  } else {
    await db.pool.query(`
      INSERT INTO tab (id,event_id,customer_id,status,opened_at,note)
      VALUES ($1,$2,$3,'open',NOW(),$4)
    `, [id, eventId, customerId, note])
  }
  res.json({ id, event_id: eventId, customer_id: customerId })
})

// Get balances for all tabs in an event
tabs.get('/event/:eventId/balances', async (req, res) => {
  const { eventId } = req.params
  if (db.kind === 'sqlite') {
    const rows = db.sql.prepare(`
      SELECT tb.* FROM tab_balance tb
      JOIN tab t ON t.id = tb.tab_id
      WHERE t.event_id = ?
      ORDER BY tb.balance DESC
    `).all(eventId)
    res.json(rows)
  } else {
    const { rows } = await db.pool.query(`
      SELECT tb.* FROM tab_balance tb
      JOIN tab t ON t.id = tb.tab_id
      WHERE t.event_id = $1
      ORDER BY tb.balance DESC
    `, [eventId])
    res.json(rows)
  }
})
