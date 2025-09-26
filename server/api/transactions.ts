// server/api/transactions.ts
import { Router } from 'express'
import db from '../db.js'

export const transactions = Router()

/**
 * GET /api/transactions/event/:eventId?limit=100
 * Returns recent transactions for an event with resolved names and "ts".
 * Shape:
 *  {
 *    id, event_id, event_beer_id, beer_name, customer_id, customer_name,
 *    qty, unit_price, ts
 *  }
 */
transactions.get('/event/:eventId', async (req, res) => {
  const { eventId } = req.params
  const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 100)))

  try {
    if (db.kind === 'sqlite') {
      const rows = db.sql.prepare(
        `
        SELECT
          t.id,
          t.event_id,
          t.event_beer_id,
          t.customer_id,
          t.qty,
          t.unit_price,
          t.created_at,
          eb.name            AS beer_name,
          c.name             AS customer_name
        FROM "transaction" t
        LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
        LEFT JOIN customer  c  ON c.id  = t.customer_id
        WHERE t.event_id = ?
        ORDER BY datetime(t.created_at) DESC
        LIMIT ?
        `
      ).all(eventId, limit)

      res.json(rows.map(mapRow))
    } else {
      const { rows } = await db.pool.query(
        `
        SELECT
          t.id,
          t.event_id,
          t.event_beer_id,
          t.customer_id,
          t.qty,
          t.unit_price,
          t.created_at,
          eb.name            AS beer_name,
          c.name             AS customer_name
        FROM "transaction" t
        LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
        LEFT JOIN customer  c  ON c.id  = t.customer_id
        WHERE t.event_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2
        `,
        [eventId, limit]
      )

      res.json(rows.map(mapRow))
    }
  } catch (err: any) {
    console.error('transactions.get error', err)
    res.status(500).json({ error: 'Failed to load transactions' })
  }
})

/**
 * (Dev helper) POST /api/transactions/seed
 * Body: { eventId, event_beer_id?, beer_name?, customer_id?, customer_name?, qty=1, unit_price=15 }
 * Creates a fake tx row so the UI shows something.
 */
transactions.post('/seed', async (req, res) => {
  const {
    eventId,
    event_beer_id = null,
    customer_id = null,
    qty = 1,
    unit_price = 15,
  } = req.body || {}

  if (!eventId) return res.status(400).json({ error: 'eventId required' })

  const now = new Date().toISOString()

  try {
    if (db.kind === 'sqlite') {
      const stmt = db.sql.prepare(
        `
        INSERT INTO "transaction" (id, event_id, event_beer_id, customer_id, qty, unit_price, created_at)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?)
        `
      )
      const result = stmt.run(eventId, event_beer_id, customer_id, Number(qty), Number(unit_price), now)
      // Fetch the row back (simple way)
      const row = db.sql.prepare(
        `
        SELECT
          t.id, t.event_id, t.event_beer_id, t.customer_id, t.qty, t.unit_price, t.created_at,
          eb.name AS beer_name, c.name AS customer_name
        FROM "transaction" t
        LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
        LEFT JOIN customer  c  ON c.id  = t.customer_id
        WHERE t.rowid = last_insert_rowid()
        `
      ).get()
      res.json(mapRow(row))
    } else {
      const { rows } = await db.pool.query(
        `
        INSERT INTO "transaction"
          (event_id, event_beer_id, customer_id, qty, unit_price, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING
          id, event_id, event_beer_id, customer_id, qty, unit_price, created_at
        `,
        [eventId, event_beer_id, customer_id, Number(qty), Number(unit_price)]
      )
      const base = rows[0]
      // resolve names in a second query (keeps it simple)
      const { rows: nameRow } = await db.pool.query(
        `
        SELECT
          eb.name AS beer_name,
          c.name  AS customer_name
        FROM (SELECT 1) x
        LEFT JOIN event_beer eb ON eb.id = $1
        LEFT JOIN customer  c  ON c.id  = $2
        `,
        [base.event_beer_id, base.customer_id]
      )
      res.json(mapRow({ ...base, ...nameRow[0] }))
    }
  } catch (err: any) {
    console.error('transactions.seed error', err)
    res.status(500).json({ error: 'Failed to seed transaction' })
  }
})

// ---- helpers ----
function mapRow(r: any) {
  return {
    id: r.id,
    event_id: r.event_id,
    event_beer_id: r.event_beer_id,
    beer_name: r.beer_name ?? null,
    customer_id: r.customer_id ?? null,
    customer_name: r.customer_name ?? null,
    qty: Number(r.qty ?? 0),
    unit_price: Number(r.unit_price ?? 0),
    ts: r.created_at, // alias for UI
  }
}
