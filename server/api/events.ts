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

type Event = {
  id: string
  name: string
  currency: string
  status: 'draft' | 'live' | 'closed'
  starts_at: string | null
  ends_at: string | null
  created_at: string
  image_url?: string | null
}

const store: Event[] = []

// GET /api/events
events.get('/', (_req: Request, res: Response) => {
  const ordered = [...store].sort((a, b) => {
    const weight = (s: Event['status']) => (s === 'live' ? 0 : s === 'draft' ? 1 : 2)
    const byStatus = weight(a.status) - weight(b.status)
    return byStatus !== 0 ? byStatus : (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })
  res.json(ordered)
})

// POST /api/events  (multipart: fields + image)
events.post('/', upload.single('image'), (req: Request, res: Response) => {
  const id = crypto.randomUUID()
  const nowIso = new Date().toISOString()
  const name = (req.body?.name || 'Beer Exchange').toString()
  const currency = (req.body?.currency || 'NOK').toString()
  const startLive = String(req.body?.startLive || 'false') === 'true'

  // file path -> public URL under /uploads/...
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
