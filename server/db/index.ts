// server/db/index.ts

import { makePostgresAdapter } from "./adapters/postgres.js";
import {MemoryAdapter} from "./adapters/memory.js";

let db: any;



if (process.env.DATABASE_URL) {
  try {
    db = await makePostgresAdapter();

  } catch (err) {
    console.error("Postgres init failed, falling back to memory:", err.message);
    db = MemoryAdapter;
  }
} else {
  console.log("🧠 Using in-memory DB");
  db = MemoryAdapter;
}

export default db;
