// server/server.ts
import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runMigrations } from './migrate.js'
import db from './db.js'

// Routers
import { events } from './api/events.js'
import { beers } from './api/beers.js'
import { transactions } from './api/transactions.js'
import { tabs } from './api/tabs.js'
import { createOrdersRouter } from './api/orders.js'
import { pricing } from './api/pricing.js'


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())
const httpServer = createServer(app)
const io = new SocketServer(httpServer, { cors: { origin: '*' } })

// Mount routes
app.use('/api/pricing', pricing)
app.use('/api/events', events)
app.use('/api/beers', beers)
app.use('/api/transactions', transactions)
app.use('/api/tabs', tabs)
app.use('/api/orders', createOrdersRouter(io))

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Serve frontend build in production
const distDir = path.resolve(__dirname, '..', 'dist_frontend')
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

const PORT = process.env.PORT || 3000
runMigrations().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
    if (db.kind === 'sqlite') console.log('DB: SQLite')
    else console.log('DB: Postgres')
  })
})