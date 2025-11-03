// server/db/adapters/memory.ts
import { DBAdapter } from "../adapter.js";

const mem = {
  transactions: [],
  customers: [],
  beers: [],
};

export const MemoryAdapter: DBAdapter = {
  async init() {
    console.log("🧠 Using in-memory DB");
  },

  async insertTransaction(tx) {
    mem.transactions.unshift(tx);
  },

  async listTransactions(eventId, limit = 100) {
    return mem.transactions
      .filter((t) => String(t.event_id) === String(eventId))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, limit);
  },
};
