// server/api/pricing.ts
import { Router } from 'express'
import db from '../db.js'
import { buildPricingContext } from '../pricing-context.js'

export const pricing = Router()

pricing.get('/event/:eventId/mispricing', async (req, res) => {
  const { eventId } = req.params
  const rows =
    db.kind === 'sqlite'
      ? db.sql.prepare(`
          SELECT id, base_price, min_price, max_price, current_price
          FROM event_beer
          WHERE event_id=?
          ORDER BY position, id
        `).all(eventId)
      : (await db.pool.query(`
          SELECT id, base_price, min_price, max_price, current_price
          FROM event_beer
          WHERE event_id=$1
          ORDER BY position, id
        `, [eventId])).rows

  const { ids, fair, prices } = buildPricingContext(rows)
  const out = ids.map((id, i) => {
    const current = prices[i]
    const target = fair[i]
    const diff = current - target
    const pct = target ? diff / target : 0
    const label = pct > 0.01 ? 'overpriced' : (pct < -0.01 ? 'underpriced' : 'fair')
    return { id, current, fair: target, diff, pct, label }
  })
  res.json(out)
})

