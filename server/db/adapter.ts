// server/db/adapter.ts

export interface DBAdapter {
  init(): Promise<void>;
  insertTransaction(tx: any): Promise<void>;
  listTransactions(eventId: string, limit?: number): Promise<any[]>;
}

// the active adapter instance (used internally)
let activeAdapter: DBAdapter | null = null;

export function registerDB(adapter: DBAdapter) {
  activeAdapter = adapter;
}

/**
 * Public API used by repos — always use dbOps instead of importing directly.
 */
export const dbOps = {
  async init() {
    if (!activeAdapter) throw new Error("DB adapter not registered");
    return activeAdapter.init();
  },

  async insertTransaction(tx: any) {
    if (!activeAdapter) throw new Error("DB adapter not registered");
    return activeAdapter.insertTransaction(tx);
  },

  async listTransactions(eventId: string, limit?: number) {
    if (!activeAdapter) throw new Error("DB adapter not registered");
    return activeAdapter.listTransactions(eventId, limit);
  },
};

export interface DBAdapter {
  kind: string;
  init(): Promise<void>;
  query?(text: string, params?: any[]): Promise<{ rows: any[] }>;

    listEvents?(): Promise<any[]>;
  getEvent?(id: string): Promise<any>;
  createEvent?(ev: any): Promise<void>;
  query?(text: string, params?: any[]): Promise<{ rows: any[] }>;
}
