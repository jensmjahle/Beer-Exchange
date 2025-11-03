import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import {
  createCustomer,
  listCustomers,
  listCustomersWithStats,
  getCustomerDetails,
  updateCustomer,
} from "../repo/customers.repo.js";

export const customers = Router();

// Ensure uploads dir exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage });

// 🔹 GET all customers for an event
customers.get("/event/:eventId", async (req, res) => {
  try {
    const rows = await listCustomers(req.params.eventId);
    res.json(rows);
  } catch (e) {
    console.error("[customers:list] failed", e);
    res.status(500).json({ error: "Failed to list customers" });
  }
});

// 🔹 GET with stats (optional)
customers.get("/event/:eventId/stats", async (req, res) => {
  try {
    const rows = await listCustomersWithStats(req.params.eventId);
    res.json(rows);
  } catch (e) {
    console.error("[customers:stats] failed", e);
    res.status(500).json({ error: "Failed to list customers with stats" });
  }
});

// 🔹 GET customer details
customers.get("/:customerId/event/:eventId", async (req, res) => {
  try {
    const details = await getCustomerDetails(
      req.params.customerId,
      req.params.eventId,
    );
    res.json(details);
  } catch (e) {
    console.error("[customers:details] failed", e);
    res.status(500).json({ error: "Failed to load customer details" });
  }
});

// 🔹 POST create (JSON or multipart)
customers.post("/event/:eventId", upload.single("image"), async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "Name is required" });

    const file = (req as any).file as Express.Multer.File | undefined;
    const profile_image_url = file
      ? `/uploads/${path.basename(file.path)}`
      : null;

    const c = await createCustomer(req.params.eventId, {
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
    });

    res.json(c);
  } catch (e) {
    console.error("[customers:create] failed", e);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// 🔹 PUT update (JSON or multipart)
customers.put("/:customerId", upload.single("image"), async (req, res) => {
  try {
    const eventId = String(req.body?.eventId || req.query?.eventId || "");
    if (!eventId) return res.status(400).json({ error: "eventId required" });

    const file = (req as any).file as Express.Multer.File | undefined;
    const profile_image_url = file
      ? `/uploads/${path.basename(file.path)}`
      : req.body?.profile_image_url;

    const updated = await updateCustomer(req.params.customerId, eventId, {
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
    });

    if (!updated) return res.status(404).json({ error: "Customer not found" });
    res.json(updated);
  } catch (e) {
    console.error("[customers:update] failed", e);
    res.status(500).json({ error: "Failed to update customer" });
  }
});
