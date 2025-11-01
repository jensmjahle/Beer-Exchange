// server/api/transactions.ts
import { Router } from 'express'
import db from '../db/index.js'
import { listTransactions, createTransaction, computeHouseFactor } from '../repo/transactions.repo.js'
import { getKurtasjePct } from '../repo/customers.repo.js'
import { recalcPricesForEvent } from '../pricing.js'

export const transactions = Router()

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
      const byBeer = new Map(db.mem.eventBeers.map(b => [b.id, b]))

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

transactions.post('/', async (req, res) => {
  const { event_id, event_beer_id, customer_id = null, qty = 1, volume_ml = null } = req.body || {}
  if (!event_id || !event_beer_id) {
    return res.status(400).json({ error: 'event_id and event_beer_id required' })
  }

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

  const pricePerLiter = Number(beer.current_price ?? beer.base_price ?? 0)
  const volLiters = (volume_ml ?? beer.volume_ml ?? 500) / 1000
  let unit_price = pricePerLiter * volLiters

  let kurtasjePct = 0.05
  try {
    if (customer_id) {
      let workRel: string | null = null
      if (db.kind === 'memory') {
        workRel = db.mem.customers.find(c => c.id === customer_id)?.work_relationship ?? null
      } else if (db.kind === 'sqlite') {
        const row = db.sql.prepare(`SELECT work_relationship FROM customer WHERE id=?`).get(customer_id)
        workRel = row?.work_relationship ?? null
      } else {
        const { rows } = await db.pool.query(`SELECT work_relationship FROM customer WHERE id=$1`, [customer_id])
        workRel = rows[0]?.work_relationship ?? null
      }
      kurtasjePct = getKurtasjePct(workRel)
    }
  } catch (e) {
    console.warn('[transactions:kurtasje] lookup failed', e)
  }
  unit_price *= (1 + kurtasjePct)

  let houseFactor = 1.0
  try {
    houseFactor = await computeHouseFactor(event_id)
  } catch (e) {
    console.warn('[transactions:houseFactor] failed', e)
  }
  unit_price *= houseFactor

  const tx = await createTransaction({
    event_id: String(event_id),
    event_beer_id: String(event_beer_id),
    customer_id: customer_id ? String(customer_id) : null,
    qty: Math.max(1, Number(qty || 1)),
    unit_price,
  })

  try {
    await recalcPricesForEvent(String(event_id), String(event_beer_id), Math.max(1, Number(qty || 1)))
  } catch (e) {
    console.error('[pricing] recalculation failed:', e)
  }

  try {
  await recalcPricesForEvent(String(event_id), String(event_beer_id), Math.max(1, Number(qty || 1)))

  // Notify all clients connected to the event stream
  const clients = globalThis.eventStreams?.get(event_id)
  if (clients) {
    for (const res of clients) {
      res.write(`event: priceUpdate\ndata: {"eventId":"${event_id}"}\n\n`)
    }
  }
} catch (e) {
  console.error('[pricing] recalculation failed:', e)
}

  return res.json(tx)
})
