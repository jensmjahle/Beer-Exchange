import express from 'express'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { events } from './api/events.js' // <-- legg merke til .js i import selv om fila er .ts
import path from 'node:path'
import express from 'express'
// …
const uploadsDir = path.join(process.cwd(), 'uploads')


const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/events', events) // mount router
app.use('/uploads', express.static(uploadsDir))
const distDir = path.join(__dirname, '..', 'dist')
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

const httpServer = createServer(app)
const io = new SocketServer(httpServer, { cors: { origin: '*' } })
io.on('connection', () => {})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
