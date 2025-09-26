import crypto from 'node:crypto'
import db, { EventBeer } from '../db/index.js'

export async function listEventBeers(eventId: string): Promise<EventBeer[]> {
  if (db.kind === 'memory') return db.mem.eventBeers.filter(b => b.event_id === eventId).sort((a,b)=>a.position-b.position || a.id.localeCompare(b.id))
  if (db.kind === 'sqlite') return db.sql.prepare(`SELECT * FROM event_beer WHERE event_id=? ORDER BY position, id`).all(eventId)
  const { rows } = await db.pool.query(`SELECT * FROM event_beer WHERE event_id=$1 ORDER BY position, id`, [eventId])
  return rows
}

export async function attachBeerToEvent(eventId: string, p: Omit<EventBeer,'id'|'event_id'>): Promise<EventBeer> {
  const b: EventBeer = { ...p, id: crypto.randomUUID(), event_id: eventId }
  if (db.kind === 'memory') { db.mem.eventBeers.push(b); return b }
  if (db.kind === 'sqlite') {
    db.sql.prepare(`
      INSERT INTO event_beer (id,event_id,beer_id,name,base_price,min_price,max_price,current_price,position,active)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(b.id, b.event_id, b.beer_id, b.name, b.base_price, b.min_price, b.max_price, b.current_price, b.position, b.active)
    return b
  }
  await db.pool.query(`
    INSERT INTO event_beer (id,event_id,beer_id,name,base_price,min_price,max_price,current_price,position,active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  `, [b.id, b.event_id, b.beer_id, b.name, b.base_price, b.min_price, b.max_price, b.current_price, b.position, b.active])
  return b
}
