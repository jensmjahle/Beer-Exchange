// Picks SQLite (embedded) or Postgres (external) based on DATABASE_URL.
// SQLite:  DATABASE_URL=sqlite:///data/beerexchange.db
// Postgres: DATABASE_URL=postgres://user:pass@host:5432/beerexchange
import Database from 'better-sqlite3'
import pg from 'pg'

const url = process.env.DATABASE_URL || 'sqlite:///data/beerexchange.db'

export type DB =
  | { kind: 'sqlite'; sql: Database.Database }
  | { kind: 'pg'; pool: pg.Pool }

let db: DB

if (url.startsWith('sqlite://')) {
  const file = url.replace('sqlite://', '')
  const sql = new Database(file)
  sql.pragma('journal_mode = WAL')
  db = { kind: 'sqlite', sql }
} else if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
  const pool = new pg.Pool({ connectionString: url })
  db = { kind: 'pg', pool }
} else {
  throw new Error(`Unsupported DATABASE_URL: ${url}`)
}

export default db
