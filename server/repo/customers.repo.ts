import crypto from 'node:crypto'
import db, { Customer } from '../db/index.js'

export async function listCustomers(eventId: string): Promise<Customer[]> {
  if (db.kind === 'memory') return db.mem.customers.filter(c => c.event_id === eventId).sort((a,b)=>a.name.localeCompare(b.name))
  if (db.kind === 'sqlite') return db.sql.prepare(`SELECT * FROM customer WHERE event_id=? ORDER BY name`).all(eventId)
  const { rows } = await db.pool.query(`SELECT * FROM customer WHERE event_id=$1 ORDER BY name`, [eventId])
  return rows
}

export async function createCustomer(eventId: string, name: string, phone?: string | null): Promise<Customer> {
  const c: Customer = { id: crypto.randomUUID(), event_id: eventId, name, phone: phone ?? null }
  if (db.kind === 'memory') { db.mem.customers.push(c); return c }
  if (db.kind === 'sqlite') { db.sql.prepare(`INSERT INTO customer (id,event_id,name,phone) VALUES (?,?,?,?)`).run(c.id, c.event_id, c.name, c.phone); return c }
  await db.pool.query(`INSERT INTO customer (id,event_id,name,phone) VALUES ($1,$2,$3,$4)`, [c.id, c.event_id, c.name, c.phone])
  return c
}
