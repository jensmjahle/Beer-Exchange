// server/db/memory.ts
import { DBAdapter } from "../adapter.js";

const mem = {
  events: [],
  customers: [],
  beers: [],
  transactions: [],
};

export const MemoryAdapter: DBAdapter = {
  kind: "memory",

  async init() {
    console.log("🧠 Using in-memory DB");
  },

  // --- EVENTS ---
  async listEvents() {
    return [...mem.events].sort((a, b) =>
      (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    );
  },
  async getEvent(id) {
    return mem.events.find((e) => e.id === id) ?? null;
  },
  async createEvent(ev) {
    mem.events.unshift(ev);
  },

  // --- TRANSACTIONS ---
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
