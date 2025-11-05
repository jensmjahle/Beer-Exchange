// server/repo/admin.repo.ts
import db from "../db/index.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "fs";
import path from "path";

function loadSql(file: string) {
  const p = path.join(process.cwd(), "server/db/sql/admin", file);
  return fs.readFileSync(p, "utf8");
}

const sql = {
  findByUsername: loadSql("findByUsername.sql"),
  countAdmins: loadSql("countAdmins.sql"),
  insertAdmin: loadSql("insertAdmin.sql"),
};

export async function seedDefaultAdmin() {
  if (db.kind === "pg") {
    const { rows } = await db.query(sql.countAdmins);
    const count = Number(rows[0]?.count ?? 0);
    if (count > 0) return false;

    const password_hash = bcrypt.hashSync("admin123", 10);
    await db.query(sql.insertAdmin, ["admin", password_hash, "SUPERUSER"]);
    console.log(
      "🔑 Default admin seeded -> username: admin, password: admin123",
    );
    return true;
  }

  if (!db.mem?.admins?.length) {
    db.mem.admins = [
      {
        id: crypto.randomUUID(),
        username: "admin",
        password_hash: bcrypt.hashSync("admin123", 10),
        role: "SUPERUSER",
      },
    ];
    console.log("🔑 Default admin seeded (in-memory)");
    return true;
  }
  return false;
}

export async function findAdminByUsername(username: string) {
  if (db.kind === "pg") {
    const { rows } = await db.query(sql.findByUsername, [username]);
    return rows[0] ?? null;
  }
  return (
    db.mem.admins.find(
      (u: any) => u.username.toLowerCase() === username.toLowerCase(),
    ) ?? null
  );
}
