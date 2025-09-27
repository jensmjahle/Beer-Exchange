import crypto from 'node:crypto'
import db, { Customer } from '../db/index.js'

export async function listCustomers(eventId: string): Promise<Customer[]> {
  if (db.kind === 'memory') {
    return db.mem.customers
      .filter(c => c.event_id === eventId)
      .sort((a,b)=>a.name.localeCompare(b.name))
  }
  if (db.kind === 'sqlite') {
    return db.sql.prepare(
      `SELECT * FROM customer WHERE event_id=? ORDER BY name`
    ).all(eventId)
  }
  const { rows } = await db.pool.query(
    `SELECT * FROM customer WHERE event_id=$1 ORDER BY name`, [eventId]
  )
  return rows
}

export async function createCustomer(eventId: string, name: string, phone?: string | null): Promise<Customer> {
  const c: Customer = { id: crypto.randomUUID(), event_id: eventId, name, phone: phone ?? null }
  if (db.kind === 'memory') { db.mem.customers.push(c); return c }
  if (db.kind === 'sqlite') {
    db.sql.prepare(
      `INSERT INTO customer (id,event_id,name,phone) VALUES (?,?,?,?)`
    ).run(c.id, c.event_id, c.name, c.phone)
    return c
  }
  await db.pool.query(
    `INSERT INTO customer (id,event_id,name,phone) VALUES ($1,$2,$3,$4)`,
    [c.id, c.event_id, c.name, c.phone]
  )
  return c
}

/** Customers + aggregate stats (beers count, tab total) for an event */
export async function listCustomersWithStats(eventId: string): Promise<Array<Customer & { beers: number; tab: number }>> {
  if (db.kind === 'memory') {
    const cs = db.mem.customers.filter(c => c.event_id === eventId)
    const tx = db.mem.transactions.filter(t => t.event_id === eventId && t.customer_id)
    const agg = new Map<string, { beers: number; tab: number }>()
    for (const t of tx) {
      const k = String(t.customer_id)
      const cur = agg.get(k) || { beers: 0, tab: 0 }
      cur.beers += Number(t.qty || 0)
      cur.tab   += Number(t.qty || 0) * Number(t.unit_price || 0)
      agg.set(k, cur)
    }
    const out = cs.map(c => ({ ...c, beers: agg.get(c.id)?.beers || 0, tab: agg.get(c.id)?.tab || 0 }))
    out.sort((a,b) => b.tab - a.tab || a.name.localeCompare(b.name))
    return out
  }

  if (db.kind === 'sqlite') {
    return db.sql.prepare(`
      SELECT
        c.id, c.event_id, c.name, c.phone,
        COALESCE(SUM(t.qty),0) AS beers,
        COALESCE(SUM(t.qty * t.unit_price),0) AS tab
      FROM customer c
      LEFT JOIN "transaction" t ON t.customer_id = c.id AND t.event_id = c.event_id
      WHERE c.event_id = ?
      GROUP BY c.id
      ORDER BY tab DESC, name ASC
    `).all(eventId)
  }

  const { rows } = await db.pool.query(`
    SELECT
      c.id, c.event_id, c.name, c.phone,
      COALESCE(SUM(t.qty),0) AS beers,
      COALESCE(SUM(t.qty * t.unit_price),0) AS tab
    FROM customer c
    LEFT JOIN "transaction" t ON t.customer_id = c.id AND t.event_id = c.event_id
    WHERE c.event_id = $1
    GROUP BY c.id
    ORDER BY tab DESC, name ASC
  `, [eventId])
  return rows
}

/** Customer details within an event: summary + transactions (with beer names) */
export async function getCustomerDetails(customerId: string, eventId: string): Promise<{
  customer: Customer | null,
  summary: { beers: number; tab: number },
  transactions: Array<{ id: string; qty: number; unit_price: number; ts: string; beer_name: string | null; beer_id: string | null }>
}> {
  if (db.kind === 'memory') {
    const customer = db.mem.customers.find(c => c.id === customerId && c.event_id === eventId) || null
    if (!customer) return { customer: null, summary: { beers: 0, tab: 0 }, transactions: [] }

    const tx = db.mem.transactions
      .filter(t => t.event_id === eventId && t.customer_id === customerId)
      .sort((a,b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

    const byBeer = new Map(db.mem.eventBeers.map(b => [b.id, b]))
    const transactions = tx.map(t => ({
      id: t.id,
      qty: Number(t.qty || 0),
      unit_price: Number(t.unit_price || 0),
      ts: t.created_at,
      beer_name: byBeer.get(t.event_beer_id || '')?.name ?? null,
      beer_id: byBeer.get(t.event_beer_id || '')?.beer_id ?? null,
    }))

    const beers = tx.reduce((s,t)=> s + Number(t.qty || 0), 0)
    const tab   = tx.reduce((s,t)=> s + Number(t.qty || 0) * Number(t.unit_price || 0), 0)

    return { customer, summary: { beers, tab }, transactions }
  }

  if (db.kind === 'sqlite') {
    const customer = db.sql.prepare(
      `SELECT * FROM customer WHERE id=? AND event_id=?`
    ).get(customerId, eventId)
    if (!customer) return { customer: null, summary: { beers: 0, tab: 0 }, transactions: [] }

    const transactions = db.sql.prepare(`
      SELECT
        t.id, t.qty, t.unit_price, t.created_at AS ts,
        eb.name AS beer_name, eb.beer_id AS beer_id
      FROM "transaction" t
      LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
      WHERE t.event_id = ? AND t.customer_id = ?
      ORDER BY datetime(t.created_at) DESC
    `).all(eventId, customerId)

    const summary = db.sql.prepare(`
      SELECT
        COALESCE(SUM(t.qty),0) AS beers,
        COALESCE(SUM(t.qty * t.unit_price),0) AS tab
      FROM "transaction" t
      WHERE t.event_id = ? AND t.customer_id = ?
    `).get(eventId, customerId)

    return { customer, summary, transactions }
  }

  const { rows: cRows } = await db.pool.query(
    `SELECT * FROM customer WHERE id=$1 AND event_id=$2`, [customerId, eventId]
  )
  const customer = cRows[0] || null
  if (!customer) return { customer: null, summary: { beers: 0, tab: 0 }, transactions: [] }

  const { rows: transactions } = await db.pool.query(`
    SELECT
      t.id, t.qty, t.unit_price, t.created_at AS ts,
      eb.name AS beer_name, eb.beer_id AS beer_id
    FROM "transaction" t
    LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
    WHERE t.event_id = $1 AND t.customer_id = $2
    ORDER BY t.created_at DESC
  `, [eventId, customerId])

  const { rows: sumRows } = await db.pool.query(`
    SELECT
      COALESCE(SUM(t.qty),0) AS beers,
      COALESCE(SUM(t.qty * t.unit_price),0) AS tab
    FROM "transaction" t
    WHERE t.event_id = $1 AND t.customer_id = $2
  `, [eventId, customerId])
  const summary = sumRows[0] || { beers: 0, tab: 0 }

  return { customer, summary, transactions }
}
