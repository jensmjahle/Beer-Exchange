// server/db/index.ts
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ───────────────────────────────────────────────────────────────
// 🧩 Type Definitions (Entities)
// ───────────────────────────────────────────────────────────────

export type DBKind = "memory" | "pg";

export type Event = {
  id: string;
  name: string;
  currency: string;
  status: "draft" | "live" | "closed";
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  image_url?: string | null;
};

export type Customer = {
  id: string;
  event_id: string;
  name: string;
  phone?: string | null;
  shoe_size?: string | null;
  weight?: string | null;
  profile_image_url?: string | null;
  work_relationship?: string | null;
  gender?: string | null;
  sexual_orientation?: string | null;
  ethnicity?: string | null;
  experience_level?: string | null;
};

export type EventBeer = {
  id: string;
  event_id: string;
  beer_id: string;
  name?: string | null;
  volume_ml: number | null;
  abv: number | null;
  description?: string | null;
  brewery?: string | null;
  style?: string | null;
  ibu?: number | null;
  image_url?: string | null;
  base_price: number;
  min_price: number;
  max_price: number;
  current_price: number;
  position: number;
  active: 0 | 1;
};

export type Tx = {
  id: string;
  event_id: string;
  event_beer_id?: string | null;
  customer_id?: string | null;
  qty: number;
  unit_price: number;
  volume_ml?: number | null;
  created_at: string;
};

// ───────────────────────────────────────────────────────────────
// 🧠 Memory DB Creator
// ───────────────────────────────────────────────────────────────

function createMemory() {
  return {
    kind: "memory" as const,
    mem: {
      events: [] as Event[],
      customers: [] as Customer[],
      eventBeers: [] as EventBeer[],
      transactions: [] as Tx[],
    },
  };
}

// ───────────────────────────────────────────────────────────────
// 🐘 Postgres Connection
// ───────────────────────────────────────────────────────────────

async function tryPg(url: string) {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url });
    await pool.query("select 1");
    console.log("[db] Connected to Postgres");
    return { kind: "pg" as const, pool };
  } catch (e: any) {
    console.warn(
      "[db] Postgres init failed → memory fallback:",
      e?.message || e,
    );
    return createMemory();
  }
}

// ───────────────────────────────────────────────────────────────
// ⚙️  Choose DB backend
// ───────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL?.trim() || "";
let db:
  | { kind: "memory"; mem: ReturnType<typeof createMemory>["mem"] }
  | { kind: "pg"; pool: any };

if (!DATABASE_URL) {
  console.log("[db] No DATABASE_URL → using in-memory DB");
  db = createMemory();
} else if (
  DATABASE_URL.startsWith("postgres://") ||
  DATABASE_URL.startsWith("postgresql://")
) {
  db = await tryPg(DATABASE_URL);
} else {
  console.warn(
    `[db] Unsupported DATABASE_URL "${DATABASE_URL}" → memory fallback`,
  );
  db = createMemory();
}

// ───────────────────────────────────────────────────────────────
// 🚀 Default export (kept for backward compatibility)
// ───────────────────────────────────────────────────────────────
export default db;

// ───────────────────────────────────────────────────────────────
// 🧩 Unified adapter registration
// ───────────────────────────────────────────────────────────────
import { registerDB, dbOps as _dbOps } from "./adapter.js";
import { MemoryAdapter } from "./adapters/memory.js";
import { PostgresAdapter } from "./adapters/postgres.js";

// Pick adapter automatically
if (db.kind === "memory") {
  registerDB(MemoryAdapter);
} else if (db.kind === "pg") {
  registerDB(PostgresAdapter);
} else {
  registerDB(MemoryAdapter);
}

export { _dbOps as dbOps };
