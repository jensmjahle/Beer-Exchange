import crypto from 'node:crypto'
import db, { Event } from '../db/index.js'

const sort = (a: Event, b: Event) => {
  const w = (s: Event['status']) => (s === 'live' ? 0 : s === 'draft' ? 1 : 2)
  const d = w(a.status) - w(b.status)
  return d !== 0 ? d : (b.created_at ?? '').localeCompare(a.created_at ?? '')
}

export async function listEvents(): Promise<Event[]> {
  if (db.kind === 'memory') return [...db.mem.events].sort(sort)
  if (db.kind === 'sqlite')
    return db.sql.prepare(`SELECT * FROM event ORDER BY CASE status WHEN 'live' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, created_at DESC`).all()
  const { rows } = await db.pool.query(`SELECT * FROM event ORDER BY CASE status WHEN 'live' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, created_at DESC`)
  return rows
}

export async function getEvent(id: string): Promise<Event | null> {
  if (db.kind === 'memory') return db.mem.events.find(e => e.id === id) ?? null
  if (db.kind === 'sqlite') return db.sql.prepare(`SELECT * FROM event WHERE id=?`).get(id) ?? null
  const { rows } = await db.pool.query(`SELECT * FROM event WHERE id=$1`, [id])
  return rows[0] ?? null
}

export async function createEvent(p: { name: string; currency: string; startLive?: boolean; image_url?: string | null }): Promise<Event> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const ev: Event = {
    id, name: p.name, currency: p.currency,
    status: p.startLive ? 'live' : 'draft',
    starts_at: p.startLive ? now : null, ends_at: null,
    created_at: now, image_url: p.image_url ?? null
  }
  if (db.kind === 'memory') { db.mem.events.unshift(ev); return ev }
  if (db.kind === 'sqlite') {
    db.sql.prepare(`INSERT INTO event (id,name,currency,status,starts_at,ends_at,created_at,image_url) VALUES (?,?,?,?,?,?,?,?)`)
      .run(ev.id, ev.name, ev.currency, ev.status, ev.starts_at, ev.ends_at, ev.created_at, ev.image_url)
    return ev
  }
  await db.pool.query(
    `INSERT INTO event (id,name,currency,status,starts_at,ends_at,created_at,image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [ev.id, ev.name, ev.currency, ev.status, ev.starts_at, ev.ends_at, ev.created_at, ev.image_url]
  )
  return ev
}
