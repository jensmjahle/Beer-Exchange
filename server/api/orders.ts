// inside POST /api/orders/webhook/vipps after you mark the order paid…

import { buildPricingContext } from '../pricing-context.js'
import { rebalanceWeighted } from '../pricing.js'

// 1) load all event_beers for this event (keep a stable order)
const rows =
  db.kind === 'sqlite'
    ? db.sql.prepare(
        `SELECT id, base_price, min_price, max_price, current_price
         FROM event_beer
         WHERE event_id=?
         ORDER BY position, id`
      ).all(order.event_id)
    : (await client.query(
        `SELECT id, base_price, min_price, max_price, current_price
         FROM event_beer
         WHERE event_id=$1
         ORDER BY position, id`,
        [order.event_id]
      )).rows

// 2) build context (ids, prices, base, fair, min/max, targetSum=sum(base))
const ctx = buildPricingContext(rows)
const boughtIndex = ctx.ids.findIndex(id => id === order.event_beer_id)

// 3) compute new prices with event-specific target
const newPrices = rebalanceWeighted({
  prices: ctx.prices,
  boughtIndex,
  delta: 1.0,          // tune sensitivity here (or per event)
  minArr: ctx.minArr,
  maxArr: ctx.maxArr,
  fair: ctx.fair,      // equals base[]
  targetSum: ctx.targetSum,
  roundTo: 0.5
})

// 4) persist back in the SAME order
for (let i = 0; i < rows.length; i++) {
  const id = ctx.ids[i]
  const price = newPrices[i]
  if (db.kind === 'sqlite') {
    db.sql.prepare(`UPDATE event_beer SET current_price=? WHERE id=?`).run(price, id)
  } else {
    await client.query(`UPDATE event_beer SET current_price=$1 WHERE id=$2`, [price, id])
  }
}
