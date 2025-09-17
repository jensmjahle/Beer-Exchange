// server/api/transactions.ts
import { Router } from 'express'
import db from '../db.js'

export const transactions = Router()

// Recent transactions for an event
transactions.get('/event/:eventId', async (req, res) => {
  const { eventId } = req.params
  const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 100)))
  if (db.kind === 'sqlite') {
    const rows = db.sql.prepare(`
      SELECT * FROM "transaction"
      WHERE event_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(eventId, limit)
    res.json(rows)
  } else {
    const { rows } = await db.pool.query(`
      SELECT * FROM "transaction"
      WHERE event_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [eventId, limit])
    res.json(rows)
  }
})
