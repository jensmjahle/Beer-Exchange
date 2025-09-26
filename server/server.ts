// server/server.ts
import express from 'express'
import cors from 'cors'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function createHttpServer() {
  const app = express()
  const server = http.createServer(app)

  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  // static uploads
  const uploadsDir = path.join(process.cwd(), 'uploads')
  app.use('/uploads', express.static(uploadsDir))

  // health
  app.get('/api/health', (_req, res) => res.json({ ok: true, db: db.kind }))

  // mount routers (ESM paths end with .js)
  const { events } = await import('./api/events.js')
  app.use('/api/events', events)

  const { beers } = await import('./api/beers.js')
  app.use('/api/beers', beers)

  const { customers } = await import('./api/customers.js')
  app.use('/api/customers', customers)

  const { transactions } = await import('./api/transactions.js')
  app.use('/api/transactions', transactions)

  return { app, server }
}
