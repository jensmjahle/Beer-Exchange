// server/server.ts
import express from 'express'
import cors from 'cors'
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import db from './db/index.js'
import { runMigrations } from './db/migrate.js'

process.on('unhandledRejection', (e) => console.error('[server] UnhandledRejection:', e))
process.on('uncaughtException', (e) => console.error('[server] UncaughtException:', e))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const server = http.createServer(app)

/** CORS for Vite dev and same-origin in prod */
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}))
app.use(express.json({ limit: '5mb' }))

/** Static uploads */
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

/** Health */
app.get('/api/health', (_req, res) => res.json({ ok: true, db: db.kind }))

/** Run migrations unless in-memory */
if (db.kind !== 'memory' && process.env.SKIP_MIGRATIONS !== '1') {
  await runMigrations()
}

/** Routers */
const { events }        = await import('./api/events.js')
const { beers }         = await import('./api/beers.js')
const { customers }     = await import('./api/customers.js')
const { transactions }  = await import('./api/transactions.js')
const { analytics }     = await import('./api/analytics.js') // <— NEW
const { admin }         = await import('./api/admin.js')
const { live }          = await import('./api/live.js')

app.use('/api/events', events)
app.use('/api/beers', beers)
app.use('/api/customers', customers)
app.use('/api/transactions', transactions)
app.use('/api/analytics', analytics) // <— NEW
app.use('/api/admin', admin)
app.use('/api/live', live)

/** Start */
const PORT = Number(process.env.PORT || 3000)
server.listen(PORT, '127.0.0.1', () => {
  console.log(`API listening on http://127.0.0.1:${PORT} (db=${db.kind})`)
})

export { app, server }
