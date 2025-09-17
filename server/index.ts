// server/index.ts (utdrag)
import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { events } from './api/events'
import { admin } from './api/admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '2mb' }))

// static uploads hvis du bruker bilder senere
import fs from 'node:fs'
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))

// routes
app.use('/api/events', events)
app.use('/api/admin', admin)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// serve frontend i prod
const distDir = path.join(__dirname, '..', 'dist')
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

const httpServer = createServer(app)
const io = new SocketServer(httpServer, { cors: { origin: '*' } })
io.on('connection', () => {})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
