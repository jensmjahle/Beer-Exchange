import crypto from 'node:crypto'
import db, { Tx } from '../db/index.js'
import { getKurtasjePct } from './customers.repo.js'

// --- beregn husets faktor basert på overskudd/underskudd -------------
export async function computeHouseFactor(eventId: string): Promise<number> {
  let total = 0, fair = 0

  if (db.kind === 'sqlite') {
    const r = db.sql.prepare(`
      SELECT
        COALESCE(SUM(t.qty * t.unit_price),0) AS total_income,
        COALESCE(SUM(t.qty * eb.base_price * (eb.volume_ml/1000.0)),0) AS fair_income
      FROM "transaction" t
      JOIN event_beer eb ON eb.id = t.event_beer_id
      WHERE t.event_id = ?
    `).get(eventId)
    total = Number(r.total_income || 0)
    fair  = Number(r.fair_income || 0)
  } else if (db.kind !== 'memory') {
    const { rows } = await db.pool.query(`
      SELECT
        COALESCE(SUM(t.qty * t.unit_price),0) AS total_income,
        COALESCE(SUM(t.qty * eb.base_price * (eb.volume_ml/1000.0)),0) AS fair_income
      FROM "transaction" t
      JOIN event_beer eb ON eb.id = t.event_beer_id
      WHERE t.event_id = $1
    `, [eventId])
    total = Number(rows[0]?.total_income || 0)
    fair  = Number(rows[0]?.fair_income || 0)
  }

  if (fair <= 0) return 1.0
  const diff = total - fair
  const ratio = diff / fair
  // demping slik at huset ikke justerer for voldsomt
  const factor = 1 + ratio * 0.1
  return Math.max(0.8, Math.min(1.2, factor))
}
// --------------------------------------------------------------------

export async function listTransactions(eventId: string, limit=100): Promise<Tx[]> {
  if (db.kind === 'memory') {
    return db.mem.transactions
      .filter(t => t.event_id === eventId)
      .sort((a,b)=> (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, limit)
  }
  if (db.kind === 'sqlite') {
    return db.sql.prepare(`
      SELECT * FROM "transaction"
      WHERE event_id=?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(eventId, limit)
  }
  const { rows } = await db.pool.query(`
    SELECT * FROM "transaction"
    WHERE event_id=$1
    ORDER BY created_at DESC
    LIMIT $2
  `, [eventId, limit])
  return rows
}

/**
 * Opprett transaksjon med volum, kurtasje og house-factor justering
 */
export async function createTransaction(t: Omit<Tx,'id'|'created_at'> & { volume_ml?: number }): Promise<Tx> {
  const now = new Date().toISOString()
  let price = Number(t.unit_price)

  // --- beregn volumpris & kurtasje ------------------------------------
  const beer = db.kind === 'memory'
    ? db.mem.eventBeers.find(b => b.id === t.event_beer_id)
    : db.kind === 'sqlite'
      ? db.sql.prepare(`SELECT * FROM event_beer WHERE id=?`).get(t.event_beer_id)
      : (await db.pool.query(`SELECT * FROM event_beer WHERE id=$1`, [t.event_beer_id])).rows[0]

  if (beer) {
    const pricePerLiter = beer.current_price ?? beer.base_price ?? 0
    const volL = (t.volume_ml ?? beer.volume_ml ?? 500) / 1000
    price = pricePerLiter * volL
  }

  // kurtasje
  let kurtasjePct = 0.05
  if (t.customer_id) {
    const c =
      db.kind === 'memory'
        ? db.mem.customers.find(x => x.id === t.customer_id)
        : db.kind === 'sqlite'
          ? db.sql.prepare(`SELECT work_relationship FROM customer WHERE id=?`).get(t.customer_id)
          : (await db.pool.query(`SELECT work_relationship FROM customer WHERE id=$1`, [t.customer_id])).rows[0]
    kurtasjePct = getKurtasjePct(c?.work_relationship)
  }
  price *= (1 + kurtasjePct)

  // --- juster mot house factor ----------------------------------------
  const hf = await computeHouseFactor(t.event_id)
  price *= hf
  // -------------------------------------------------------------------

  const tx: Tx = {
    ...t,
    id: crypto.randomUUID(),
    created_at: now,
    unit_price: price,
  }

  // lagre
  if (db.kind === 'memory') { db.mem.transactions.unshift(tx); return tx }
  if (db.kind === 'sqlite') {
    db.sql.prepare(`
      INSERT INTO "transaction" (id,event_id,event_beer_id,customer_id,qty,unit_price,created_at)
      VALUES (?,?,?,?,?,?,?)
    `).run(tx.id, tx.event_id, tx.event_beer_id, tx.customer_id, tx.qty, tx.unit_price, tx.created_at)
    return tx
  }
  await db.pool.query(`
    INSERT INTO "transaction" (id,event_id,event_beer_id,customer_id,qty,unit_price,created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
  `, [tx.id, tx.event_id, tx.event_beer_id, tx.customer_id, tx.qty, tx.unit_price, tx.created_at])
  return tx
}
