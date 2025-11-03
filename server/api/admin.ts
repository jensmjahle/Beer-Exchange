// server/api/admin.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { signJwt, requireAdmin } from "../auth/jwt";

// Typing for admin user
type AdminUser = {
  id: string;
  username: string;
  password_hash: string;
  role: "SUPERUSER" | "MODERATOR";
};

// In-memory users
const users: AdminUser[] = [];

// Seed a default admin user if none exist
// username: admin
// password: admin123
if (users.length === 0) {
  const password_hash = bcrypt.hashSync("admin123", 10);
  users.push({
    id: crypto.randomUUID(),
    username: "admin",
    password_hash,
    role: "SUPERUSER",
  });
  console.log("🔑 Default admin seeded -> username: admin, password: admin123");
}

export const admin = Router();

// POST /api/admin/login
admin.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username & password required" });
  }

  const user = users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase(),
  );
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signJwt({ sub: user.username, role: user.role });
  console.log("token", token);
  return res.json({ token });
});

// Example protected route
admin.get("/me", requireAdmin, (req: any, res) => {
  res.json({ ok: true, user: req.user });
});
