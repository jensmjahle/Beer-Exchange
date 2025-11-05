// server/db/index.ts

import { makePostgresAdapter } from "./adapters/postgres";

let db: any;

if (process.env.DATABASE_URL) {
  try {
    db = await makePostgresAdapter();
  } catch (err) {
    console.error("Postgres init failed, falling back to memory:", err.message);
    db = makeMemoryAdapter();
  }
} else {
  console.log("🧠 Using in-memory DB");
  db = makeMemoryAdapter();
}

export default db;
