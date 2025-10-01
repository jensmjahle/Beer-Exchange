import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

import {
  listCustomers,
  createCustomer,
  listCustomersWithStats,
  getCustomerDetails,
  updateCustomer
} from '../repo/customers.repo.js'

export const customers = Router()

// uploads dir
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname || '')}`),
})
const upload = multer({ storage })

// list
customers.get('/event/:eventId', async (req, res) => {
  res.json(await listCustomers(req.params.eventId))
})

// create (JSON or multipart)
customers.post('/event/:eventId', upload.single('image'), async (req, res) => {
  try {
    const name = String(req.body?.name || '')
    if (!name.trim()) return res.status(400).json({ error: 'name required' })

    const file = (req as any).file as Express.Multer.File | undefined
    const profile_image_url = file ? `/uploads/${path.basename(file.path)}` : (req.body?.profile_image_url ?? null)

    const input = {
      name,
      phone: req.body?.phone ?? null,
      shoe_size: req.body?.shoe_size ?? null,
      weight: req.body?.weight ?? null,
      profile_image_url,
      work_relationship: req.body?.work_relationship ?? null,
      gender: req.body?.gender ?? null,
      sexual_orientation: req.body?.sexual_orientation ?? null,
      ethnicity: req.body?.ethnicity ?? null,
      experience_level: req.body?.experience_level ?? null,
    }

    const c = await createCustomer(req.params.eventId, input)
    res.json(c)
  } catch (e) {
    console.error('[customers:create] failed', e)
    res.status(500).json({ error: 'Failed to create customer' })
  }
})

// update (JSON or multipart)
customers.put('/:customerId', upload.single('image'), async (req, res) => {
  try {
    const eventId = String(req.body?.eventId || req.query?.eventId || '')
    if (!eventId) return res.status(400).json({ error: 'eventId required' })

    const file = (req as any).file as Express.Multer.File | undefined
    const profile_image_url = file
      ? `/uploads/${path.basename(file.path)}`
      : (req.body?.profile_image_url) // undefined if omitted

    const input = {
      name: req.body?.name,
      phone: req.body?.phone,
      shoe_size: req.body?.shoe_size,
      weight: req.body?.weight,
      profile_image_url,
      work_relationship: req.body?.work_relationship,
      gender: req.body?.gender,
      sexual_orientation: req.body?.sexual_orientation,
      ethnicity: req.body?.ethnicity,
      experience_level: req.body?.experience_level,
    }

    const c = await updateCustomer(req.params.customerId, eventId, input)
    if (!c) return res.status(404).json({ error: 'Customer not found' })
    res.json(c)
  } catch (e) {
    console.error('[customers:update] failed', e)
    res.status(500).json({ error: 'Failed to update customer' })
  }
})

// with stats
customers.get('/event/:eventId/with-stats', async (req, res) => {
  try {
    const rows = await listCustomersWithStats(req.params.eventId)
    res.json(rows)
  } catch (e) {
    console.error('[customers:with-stats] failed', e)
    res.status(500).json({ error: 'Failed to list customers with stats' })
  }
})

// details
customers.get('/:customerId/details', async (req, res) => {
  const eventId = String(req.query.eventId || '')
  if (!eventId) return res.status(400).json({ error: 'eventId required' })
  try {
    const data = await getCustomerDetails(req.params.customerId, eventId)
    if (!data.customer) return res.status(404).json({ error: 'Customer not found' })
    res.json(data)
  } catch (e) {
    console.error('[customers:details] failed', e)
    res.status(500).json({ error: 'Failed to load customer details' })
  }
})
