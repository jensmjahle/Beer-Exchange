import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { listEvents, getEvent, createEvent } from '../repo/events.repo.js'

export const events = Router()

const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname || '')}`)
})
const upload = multer({ storage })

events.get('/', async (_req, res) => res.json(await listEvents()))
events.get('/:id', async (req, res) => {
  const ev = await getEvent(req.params.id)
  return ev ? res.json(ev) : res.status(404).json({ error: 'event not found' })
})
events.post('/', upload.single('image'), async (req, res) => {
  const name = String(req.body?.name || 'Beer Exchange')
  const currency = String(req.body?.currency || 'NOK')
  const startLive = String(req.body?.startLive || 'false') === 'true'
  const file = (req as any).file as Express.Multer.File | undefined
  const image_url = file ? `/uploads/${path.basename(file.path)}` : null
  const ev = await createEvent({ name, currency, startLive, image_url })
  res.json(ev)
})
