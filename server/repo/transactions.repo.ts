import crypto from 'node:crypto'
import db, { Tx } from '../db/index.js'

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

export async function createTransaction(t: Omit<Tx,'id'|'created_at'>): Promise<Tx> {
  const tx: Tx = { ...t, id: crypto.randomUUID(), created_at: new Date().toISOString() }
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
