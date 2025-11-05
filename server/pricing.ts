import db from "./db/index.js";
import { buildPricingContext } from "./pricing-context.js";
import { insertPriceUpdate } from "./repo/priceUpdate.repo.js";

type Row = {
  id: string;
  event_id: string;
  base_price: number;
  min_price: number;
  max_price: number;
  current_price: number;
  active: boolean;
};

// Tunables
const STEP_PER_UNIT = 1.0;
const MIN_STEP = 0.5;
const MAX_ITER = 10;
const HOUSE_ADJUST_STRENGTH = 0.25; // hvor mye houseFactor påvirker justering (0.25 = 25%)

async function computeHouseFactor(eventId: string): Promise<number> {
  if (db.kind === "memory") {
    const txs = db.mem.transactions.filter((t) => t.event_id === eventId);
    if (!txs.length) return 1.0;

    let total = 0;
    let fair = 0;
    for (const t of txs) {
      const eb = db.mem.eventBeers.find((b) => b.id === t.event_beer_id);
      if (!eb) continue;
      total += t.qty * t.unit_price;
      fair += t.qty * eb.base_price;
    }

    if (fair === 0) return 1.0;
    const diff = total - fair;
    const ratio = diff / fair;
    const factor = 1 + ratio * 0.1;
    return Math.max(0.8, Math.min(1.2, factor));
  }

  // Postgres
  const { rows } = await db.query("pricing/compute_house_factor.sql", [
    eventId,
  ]);
  const total = Number(rows[0]?.total_income || 0);
  const fair = Number(rows[0]?.fair_income || 0);
  if (fair === 0) return 1.0;

  // Overskudd => factor > 1, underskudd => factor < 1
  const diff = total - fair;
  const ratio = diff / fair;
  const factor = 1 + ratio * 0.1;
  return Math.max(0.8, Math.min(1.2, factor));
}

// ----------------------------------------------------------------------------
// PRISBEREGNING
// ----------------------------------------------------------------------------

function raiseBoughtAndRebalance(
  rows: Row[],
  boughtId: string | null,
  qty: number,
  houseFactor: number,
): Row[] {
  // Sikre tall
  for (const r of rows) {
    r.base_price = Number(r.base_price);
    r.min_price = Number(r.min_price);
    r.max_price = Number(r.max_price);
    r.current_price = Number(r.current_price);
  }

  const ctx = buildPricingContext(rows);
  const idToRow = new Map(rows.map((r) => [r.id, r]));

  // 1️⃣ Øk kjøpt øl
  if (boughtId) {
    const b = idToRow.get(boughtId);
    if (b) {
      const step = Math.max(MIN_STEP, STEP_PER_UNIT) * Math.max(1, qty);
      const newPrice = Math.min(b.max_price, b.current_price + step);
      console.log(
        `[pricing] ↑ ${b.id} ${b.current_price.toFixed(2)} → ${newPrice.toFixed(2)} (+${step.toFixed(1)})`,
      );
      b.current_price = newPrice;
    }
  }

  // 2️⃣ Rebalanser slik at total sum = targetSum
  const target = ctx.targetSum;
  let sum = rows.reduce((a, r) => a + r.current_price, 0);
  let excess = sum - target;
  let guard = 0;

  while (Math.abs(excess) > 1e-6 && guard++ < MAX_ITER) {
    if (excess > 0) {
      // For høy total — senk andre
      const others = rows.filter((r) => r.id !== boughtId);
      const totalSlack = others.reduce(
        (a, r) => a + Math.max(0, r.current_price - r.min_price),
        0,
      );
      if (totalSlack <= 1e-9) break;
      for (const r of others) {
        const slack = Math.max(0, r.current_price - r.min_price);
        if (slack > 0) {
          const delta = excess * (slack / totalSlack);
          r.current_price = Math.max(r.min_price, r.current_price - delta);
        }
      }
    } else {
      // For lav total — øk andre
      const others = rows.filter((r) => r.id !== boughtId);
      const upSlack = others.reduce(
        (a, r) => a + Math.max(0, r.max_price - r.current_price),
        0,
      );
      if (upSlack <= 1e-9) break;
      for (const r of others) {
        const slack = Math.max(0, r.max_price - r.current_price);
        if (slack > 0) {
          const delta = -excess * (slack / upSlack);
          r.current_price = Math.min(r.max_price, r.current_price + delta);
        }
      }
    }
    sum = rows.reduce((a, r) => a + r.current_price, 0);
    excess = sum - target;
  }

  // 3️⃣ Juster globalt basert på houseFactor
  const adjustment = 1 + (1 - houseFactor) * HOUSE_ADJUST_STRENGTH;
  for (const r of rows) {
    r.current_price = Math.max(
      r.min_price,
      Math.min(r.max_price, Number((r.current_price * adjustment).toFixed(1))),
    );
  }

  return rows;
}

// ----------------------------------------------------------------------------
// REKALKULERING
// ----------------------------------------------------------------------------

export async function recalcPricesForEvent(
  eventId: string,
  boughtBeerId: string | null,
  qty: number = 1,
) {
  let rows: any[] = [];

  if (db.kind === "memory") {
    rows = db.mem.eventBeers
      .filter((b) => b.event_id === eventId && b.active)
      .map((b) => ({ ...b }));
  } else {
    const { rows: r } = await db.query("pricing/get_active_event_beers.sql", [
      eventId,
    ]);
    rows = r.map((r) => ({
      ...r,
      base_price: Number(r.base_price),
      min_price: Number(r.min_price),
      max_price: Number(r.max_price),
      current_price: Number(r.current_price),
    }));
  }

  if (!rows.length) return;

  // 💰 Hent house factor først
  const houseFactor = await computeHouseFactor(eventId);
  console.log(`[house] factor for ${eventId}: ${houseFactor.toFixed(3)}`);

  // Beregn nye priser
  const updated = raiseBoughtAndRebalance(rows, boughtBeerId, qty, houseFactor);

  // Lagre resultat
  if (db.kind === "memory") {
    const map = new Map(updated.map((u) => [u.id, u.current_price]));
    for (const b of db.mem.eventBeers) {
      if (b.event_id === eventId && map.has(b.id)) {
        const oldPrice = Number(b.current_price);
        const newPrice = map.get(b.id)!;
        b.current_price = newPrice;
        await insertPriceUpdate(b.id, oldPrice, newPrice);
      }
    }
  } else {
    try {
      await db.query("BEGIN");
      for (const r of updated) {
        const oldRow = rows.find((row) => row.id === r.id);
        const oldPrice = oldRow ? Number(oldRow.current_price) : null;
        const newPrice = Number(r.current_price);

        await db.query(
          `UPDATE event_beer SET current_price = $1 WHERE id = $2`,
          [newPrice, r.id],
        );

        await insertPriceUpdate(r.id, oldPrice, newPrice);
      }
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    }
  }
}
