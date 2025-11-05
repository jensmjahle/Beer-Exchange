import { v4 as uuid } from "uuid";
import db from "../db/index.js";

export async function listTransactions(eventId: string, limit = 100) {
  if (db.kind === "memory") {
    return db.mem.transactions
      .filter((t) => t.event_id === eventId)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, limit)
      .map((t) => {
        const c = db.mem.customers.find((c) => c.id === t.customer_id);
        const b = db.mem.eventBeers.find((b) => b.id === t.event_beer_id);
        return {
          ...t,
          customer_name: c?.name ?? null,
          beer_name: b?.name ?? null,
          beer_id: b?.beer_id ?? null,
        };
      });
  }

  const { rows } = await db.query("transactions/listTransactions.sql", [
    eventId,
    limit,
  ]);
  return rows;
}

export async function createTransaction(input: {
  event_id: string;
  event_beer_id: string;
  customer_id?: string | null;
  qty: number;
  volume_ml: number;
  price_client: number;
}) {
  const id = uuid();
  const unit_price = Number(input.price_client || 0);

  if (db.kind === "memory") {
    const tx = {
      id,
      ...input,
      unit_price,
      created_at: new Date().toISOString(),
    };
    db.mem.transactions.push(tx);
    return tx;
  }

  const params = [
    id,
    input.event_id,
    input.event_beer_id,
    input.customer_id,
    input.qty,
    input.volume_ml,
    unit_price,
  ];
  const { rows } = await db.query("transactions/insertTransaction.sql", params);
  return rows[0];
}
