import fs from 'node:fs'
import path from 'node:path'
import db from './db.js'

export async function runMigrations() {
  const file = path.join(process.cwd(), 'server', 'migrations', '001_init.sql')
  const sqlText = fs.readFileSync(file, 'utf8')

  if (db.kind === 'sqlite') {
    db.sql.exec(sqlText)
  } else {
    const client = await db.pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sqlText)
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}
