// server/api/events.ts
import { Router, Request, Response } from 'express'
import crypto from 'node:crypto'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'

export const events = Router()

// Ensure uploads dir exists
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})
const upload = multer({ storage })

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

// In-memory store (replace with DB later)
const store: Event[] = []
export function getEventById(id: string) { return store.find(e => e.id === id) }

// ---------- LIST ----------
events.get('/', (_req: Request, res: Response) => {
  const ordered = [...store].sort((a, b) => {
    const weight = (s: Event['status']) => (s === 'live' ? 0 : s === 'draft' ? 1 : 2)
    const byStatus = weight(a.status) - weight(b.status)
    return byStatus !== 0 ? byStatus : (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })
  res.json(ordered)
})

// ---------- GET ONE ----------
events.get('/:id', (req: Request, res: Response) => {
  const ev = getEventById(req.params.id)
  if (!ev) return res.status(404).json({ error: 'event not found' })
  res.json(ev)
})

// ---------- CREATE (multipart) ----------
events.post('/', upload.single('image'), (req: Request, res: Response) => {
  const id = crypto.randomUUID()
  const nowIso = new Date().toISOString()
  const name = (req.body?.name || 'Beer Exchange').toString()
  const currency = (req.body?.currency || 'NOK').toString()
  const startLive = String(req.body?.startLive || 'false') === 'true'

  const file = (req as any).file as Express.Multer.File | undefined
  const image_url = file ? `/uploads/${path.basename(file.path)}` : null

  const ev: Event = {
    id,
    name,
    currency,
    status: startLive ? 'live' : 'draft',
    starts_at: startLive ? nowIso : null,
    ends_at: null,
    created_at: nowIso,
    image_url,
  }
  store.unshift(ev)
  res.json(ev)
})

// ---------- UPDATE (name/currency/image) ----------
events.patch('/:id', upload.single('image'), (req: Request, res: Response) => {
  const ev = getEventById(req.params.id)
  if (!ev) return res.status(404).json({ error: 'event not found' })

  if (typeof req.body?.name === 'string') ev.name = req.body.name
  if (typeof req.body?.currency === 'string') ev.currency = req.body.currency

  const file = (req as any).file as Express.Multer.File | undefined
  if (file) ev.image_url = `/uploads/${path.basename(file.path)}`

  res.json(ev)
})

// ---------- START ----------
events.post('/:id/start', (req: Request, res: Response) => {
  const ev = getEventById(req.params.id)
  if (!ev) return res.status(404).json({ error: 'event not found' })
  if (ev.status !== 'live') {
    ev.status = 'live'
    ev.starts_at = new Date().toISOString()
    ev.ends_at = null
  }
  res.json(ev)
})

// ---------- CLOSE ----------
events.post('/:id/close', (req: Request, res: Response) => {
  const ev = getEventById(req.params.id)
  if (!ev) return res.status(404).json({ error: 'event not found' })
  if (ev.status !== 'closed') {
    ev.status = 'closed'
    ev.ends_at = new Date().toISOString()
  }
  res.json(ev)
})
