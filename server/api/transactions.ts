// server/api/transactions.ts
import { Router } from 'express'
import db from '../db/index.js'
import { listTransactions, createTransaction } from '../repo/transactions.repo.js'
import { recalcPricesForEvent } from '../pricing.js'

export const transactions = Router()

// ⬇️ Return enriched rows: customer_name, beer_name, beer_id, ts
transactions.get('/event/:eventId', async (req, res) => {
  const { eventId } = req.params
  const limit = Math.max(1, Math.min(500, Number(req.query.limit ?? 100)))

  try {
    if (db.kind === 'memory') {
      const raw = db.mem.transactions
        .filter(t => t.event_id === eventId)
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .slice(0, limit)

      const byCustomer = new Map(db.mem.customers.map(c => [c.id, c]))
      const byBeer     = new Map(db.mem.eventBeers.map(b => [b.id, b]))

      const rows = raw.map(t => {
        const c = t.customer_id ? byCustomer.get(t.customer_id) : null
        const b = t.event_beer_id ? byBeer.get(t.event_beer_id) : null
        return {
          id: t.id,
          event_id: t.event_id,
          event_beer_id: t.event_beer_id,
          customer_id: t.customer_id,
          qty: t.qty,
          unit_price: t.unit_price,
          ts: t.created_at,
          customer_name: c?.name ?? null,
          beer_name: b?.name ?? null,
          beer_id: b?.beer_id ?? null,
        }
      })
      return res.json(rows)
    }

    if (db.kind === 'sqlite') {
      const rows = db.sql.prepare(`
        SELECT
          t.id,
          t.event_id,
          t.event_beer_id,
          t.customer_id,
          t.qty,
          t.unit_price,
          t.created_at AS ts,
          c.name AS customer_name,
          eb.name AS beer_name,
          eb.beer_id AS beer_id
        FROM "transaction" t
        LEFT JOIN customer c   ON c.id = t.customer_id
        LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
        WHERE t.event_id = ?
        ORDER BY datetime(t.created_at) DESC
        LIMIT ?
      `).all(eventId, limit)
      return res.json(rows)
    }

    // pg
    const { rows } = await db.pool.query(`
      SELECT
        t.id,
        t.event_id,
        t.event_beer_id,
        t.customer_id,
        t.qty,
        t.unit_price,
        t.created_at AS ts,
        c.name AS customer_name,
        eb.name AS beer_name,
        eb.beer_id AS beer_id
      FROM "transaction" t
      LEFT JOIN customer   c  ON c.id = t.customer_id
      LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
      WHERE t.event_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2
    `, [eventId, limit])
    return res.json(rows)
  } catch (e) {
    console.error('[transactions:list] failed:', e)
    return res.status(500).json({ error: 'Failed to list transactions' })
  }
})

// POST: compute authoritative unit_price and recalc prices (unchanged)
transactions.post('/', async (req, res) => {
  const { event_id, event_beer_id, customer_id = null, qty = 1 } = req.body || {}
  if (!event_id || !event_beer_id) {
    return res.status(400).json({ error: 'event_id and event_beer_id required' })
  }

  // fetch beer for price
  let beer: any
  try {
    if (db.kind === 'memory') {
      beer = db.mem.eventBeers.find(b => b.id === String(event_beer_id) && b.event_id === String(event_id))
    } else if (db.kind === 'sqlite') {
      beer = db.sql.prepare(`SELECT * FROM event_beer WHERE id=? AND event_id=?`).get(String(event_beer_id), String(event_id))
    } else {
      const r = await db.pool.query(`SELECT * FROM event_beer WHERE id=$1 AND event_id=$2`, [String(event_beer_id), String(event_id)])
      beer = r.rows[0]
    }
  } catch {
    return res.status(500).json({ error: 'Failed to read beer' })
  }

  if (!beer) return res.status(404).json({ error: 'Beer not found for this event' })
  if (beer.active === 0) return res.status(400).json({ error: 'Beer is inactive' })

  const unit_price = Number(beer.current_price ?? beer.base_price ?? 0)
  const tx = await createTransaction({
    event_id: String(event_id),
    event_beer_id: String(event_beer_id),
    customer_id: customer_id ? String(customer_id) : null,
    qty: Math.max(1, Number(qty || 1)),
    unit_price,
  })

  try {
    const { recalcPricesForEvent } = await import('../pricing.js')
    await recalcPricesForEvent(String(event_id), String(event_beer_id), Math.max(1, Number(qty || 1)))
  } catch (e) {
    console.error('[pricing] recalculation failed:', e)
  }

  res.json(tx)
})
