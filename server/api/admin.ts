// server/api/admin.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import { signJwt, requireAdmin } from "../auth/jwt.js";
import { seedDefaultAdmin, findAdminByUsername } from "../repo/admin.repo.js";

export const admin = Router();

// --- Seed default admin on startup ---
await seedDefaultAdmin();

// --- Login ---
admin.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "username & password required" });

  const user = await findAdminByUsername(username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signJwt({ sub: user.username, role: user.role });
  res.json({ token });
});

// --- Protected route example ---
admin.get("/me", requireAdmin, (req: any, res) => {
  res.json({ ok: true, user: req.user });
});
