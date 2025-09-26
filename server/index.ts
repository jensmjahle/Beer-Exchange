import express from 'express'
import cors from 'cors'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import db from './db/index.js'
import { runMigrations } from './db/migrate.js'

process.on('unhandledRejection', (e) => console.error('[server] UnhandledRejection:', e))
process.on('uncaughtException', (e) => console.error('[server] UncaughtException:', e))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/api/health', (_req, res) => res.json({ ok: true, db: db.kind }))

// migrations (skip in memory)
if (db.kind !== 'memory' && process.env.SKIP_MIGRATIONS !== '1') {
  await runMigrations()
}

// mount routers (ESM .js imports)
const { events } = await import('./api/events.js')
const { beers }   = await import('./api/beers.js')
const { customers } = await import('./api/customers.js')
const { transactions } = await import('./api/transactions.js')
app.use('/api/events', events)
app.use('/api/beers', beers)
app.use('/api/customers', customers)
app.use('/api/transactions', transactions)

const PORT = Number(process.env.PORT || 3000)
server.listen(PORT, '127.0.0.1', () => {
  console.log(`API listening on http://127.0.0.1:${PORT} (db=${db.kind})`)
})
