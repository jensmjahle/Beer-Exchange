import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  listCustomersWithStats,
  getCustomerDetails,
} from "../repo/customers.repo.js";

export const customers = Router();

// 📂 lagre opplastede bilder
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname || "")}`),
});
const upload = multer({ storage });

// Hent alle kunder for et event
customers.get("/event/:eventId", async (req, res) => {
  try {
    const rows = await listCustomers(req.params.eventId);
    res.json(rows);
  } catch (e) {
    console.error("[customers:list]", e);
    res.status(500).json({ error: "Failed to list customers" });
  }
});

// Hent kunder med statistikk
customers.get("/event/:eventId/stats", async (req, res) => {
  try {
    const rows = await listCustomersWithStats(req.params.eventId);
    res.json(rows);
  } catch (e) {
    console.error("[customers:stats]", e);
    res.status(500).json({ error: "Failed to list customers with stats" });
  }
});

// Hent detalj for én kunde
customers.get("/:customerId/event/:eventId", async (req, res) => {
  try {
    const { customerId, eventId } = req.params;
    const details = await getCustomerDetails(customerId, eventId);
    console.log("Fetched customer details:", details);
    if (!details.customer)
      return res.status(404).json({ error: "Customer not found" });
    res.json(details);
  } catch (e) {
    console.error("[customers:get]", e);
    res.status(500).json({ error: "Failed to fetch customer details" });
  }
});

// 🧾 Opprett ny kunde (med bilde)
customers.post("/event/:eventId", upload.single("image"), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const body = req.body || {};
    const file = req.file;

    console.log("Creating customer with data:", body, file);

    if (!body.name || !body.name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const profile_image_url = file
      ? `/uploads/${path.basename(file.path)}`
      : null;

    const c = await createCustomer(eventId, {
      ...body,
      profile_image_url,
    });

    res.status(201).json(c);
  } catch (e) {
    console.error("[customers:create]", e);
    res.status(500).json({ error: "Failed to create customer" });
  }
});

// Oppdater kunde
customers.put(
  "/:customerId/event/:eventId",
  upload.single("image"),
  async (req, res) => {
    try {
      const { customerId, eventId } = req.params;
      const file = req.file;
      const data = { ...req.body };

      if (file) {
        data.image_url = `/uploads/${path.basename(file.path)}`;
      }

      const updated = await updateCustomer(customerId, eventId, data);
      if (!updated) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(updated);
    } catch (e) {
      console.error("[customers:update]", e);
      res.status(500).json({ error: "Failed to update customer" });
    }
  },
);
