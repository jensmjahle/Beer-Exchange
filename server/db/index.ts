// server/db/index.ts
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export type DBKind = 'memory' | 'sqlite' | 'pg'

export type Event = {
  id: string
  name: string
  currency: string
  status: 'draft' | 'live' | 'closed'
  starts_at: string | null
  ends_at: string | null
  created_at: string
  image_url?: string | null
}
export type Customer = {
  id: string
  event_id: string
  name: string
  phone?: string | null
}
export type EventBeer = {
  id: string
  event_id: string
  beer_id: string
  name?: string | null
  base_price: number
  min_price: number
  max_price: number
  current_price: number
  position: number
  active: 0 | 1
}
export type Tx = {
  id: string
  event_id: string
  event_beer_id?: string | null
  customer_id?: string | null
  qty: number
  unit_price: number
  created_at: string
}

function createMemory() {
  return {
    kind: 'memory' as const,
    mem: {
      events: [] as Event[],
      customers: [] as Customer[],
      eventBeers: [] as EventBeer[],
      transactions: [] as Tx[],
    },
  }
}

async function trySqlite(url: string) {
  try {
    const Database = (await import('better-sqlite3')).default
    const raw = url.replace('sqlite://', '')
    const file = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw)
    const dir = path.dirname(file)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const sql = new Database(file)
    sql.pragma('journal_mode = WAL')
    sql.pragma('foreign_keys = ON')
    return { kind: 'sqlite' as const, sql }
  } catch (e: any) {
    console.warn('[db] SQLite init failed → memory:', e?.message || e)
    return createMemory()
  }
}

async function tryPg(url: string) {
  try {
    const { Pool } = await import('pg')
    const pool = new Pool({ connectionString: url })
    await pool.query('select 1')
    return { kind: 'pg' as const, pool }
  } catch (e: any) {
    console.warn('[db] Postgres init failed → memory:', e?.message || e)
    return createMemory()
  }
}

const DATABASE_URL = process.env.DATABASE_URL?.trim() || ''
let db:
  | { kind: 'memory'; mem: ReturnType<typeof createMemory>['mem'] }
  | { kind: 'sqlite'; sql: any }
  | { kind: 'pg'; pool: any }

if (!DATABASE_URL) db = createMemory()
else if (DATABASE_URL.startsWith('sqlite://')) db = await trySqlite(DATABASE_URL)
else if (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://')) db = await tryPg(DATABASE_URL)
else { console.warn(`[db] Unsupported DATABASE_URL "${DATABASE_URL}" → memory`); db = createMemory() }

export default db
