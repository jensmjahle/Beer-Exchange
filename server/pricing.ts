// server/pricing.ts
import db from "./db/index.js";
import { buildPricingContext } from "./pricing-context.js";
import { insertPriceUpdate } from "./repo/priceUpdate.repo";

type Row = {
  id: string;
  event_id: string;
  base_price: number;
  min_price: number;
  max_price: number;
  current_price: number;
  active: number;
};

// Tunables: step per unit bought. Ex: 1.0 NOK per beer, minimum 0.5.
const STEP_PER_UNIT = 1.0;
const MIN_STEP = 0.5;

function raiseBoughtAndRebalance(
  rows: Row[],
  boughtId: string | null,
  qty: number,
): Row[] {
  const ctx = buildPricingContext(
    rows.map((r) => ({
      id: r.id,
      base_price: r.base_price,
      min_price: r.min_price,
      max_price: r.max_price,
      current_price: r.current_price,
    })),
  );
  const idToRow = new Map(rows.map((r) => [r.id, r]));

  // 1) Raise the bought beer
  if (boughtId) {
    const b = idToRow.get(boughtId);
    if (b) {
      const step = Math.max(MIN_STEP, STEP_PER_UNIT) * Math.max(1, qty);
      b.current_price = Math.min(b.max_price, b.current_price + step);
    }
  }

  // 2) Rebalance so sum(prices) = targetSum
  const target = ctx.targetSum;
  let sum = rows.reduce((a, r) => a + r.current_price, 0);
  let excess = sum - target; // positive => need to decrease others; negative => increase others
  let guard = 0;

  while (Math.abs(excess) > 1e-6 && guard++ < 10) {
    if (excess > 0) {
      // Need to lower others (prefer not lowering the bought one)
      const others = rows.filter((r) => r.id !== boughtId);
      const totalSlack = others.reduce(
        (a, r) => a + Math.max(0, r.current_price - r.min_price),
        0,
      );
      if (totalSlack <= 1e-9) {
        // Nowhere to lower -> push back into bought beer if possible
        const b = boughtId ? idToRow.get(boughtId) : null;
        if (b) {
          const canDrop = Math.max(0, b.current_price - b.min_price);
          const drop = Math.min(canDrop, excess);
          b.current_price -= drop;
          excess -= drop;
        } else {
          // nothing we can do
          break;
        }
      } else {
        for (const r of others) {
          const slack = Math.max(0, r.current_price - r.min_price);
          if (slack <= 0) continue;
          const delta = excess * (slack / totalSlack);
          r.current_price = Math.max(r.min_price, r.current_price - delta);
        }
        // recompute
        sum = rows.reduce((a, r) => a + r.current_price, 0);
        excess = sum - target;
      }
    } else {
      // excess < 0: we need to increase others (rare here, but keep symmetric)
      const others = rows.filter((r) => r.id !== boughtId);
      const upSlack = others.reduce(
        (a, r) => a + Math.max(0, r.max_price - r.current_price),
        0,
      );
      if (upSlack <= 1e-9) {
        const b = boughtId ? idToRow.get(boughtId) : null;
        if (b) {
          const canRaise = Math.max(0, b.max_price - b.current_price);
          const add = Math.min(canRaise, -excess);
          b.current_price += add;
          excess += add;
        } else {
          break;
        }
      } else {
        for (const r of others) {
          const slack = Math.max(0, r.max_price - r.current_price);
          if (slack <= 0) continue;
          const delta = -excess * (slack / upSlack);
          r.current_price = Math.min(r.max_price, r.current_price + delta);
        }
        sum = rows.reduce((a, r) => a + r.current_price, 0);
        excess = sum - target;
      }
    }
  }

  // Final rounding (optional): keep a single decimal place
  for (const r of rows) {
    r.current_price = Math.max(
      r.min_price,
      Math.min(r.max_price, Number(r.current_price.toFixed(1))),
    );
  }
  return rows;
}

export async function recalcPricesForEvent(
  eventId: string,
  boughtBeerId: string | null,
  qty: number = 1,
) {
  // Load active beers
  let rows: Row[] = [];
  if (db.kind === "memory") {
    rows = db.mem.eventBeers
      .filter((b: any) => b.event_id === eventId && b.active !== 0)
      .map((b: any) => ({ ...b }));
  } else if (db.kind === "sqlite") {
    rows = db.sql
      .prepare(
        `
      SELECT id, event_id, base_price, min_price, max_price, current_price, active
      FROM event_beer WHERE event_id=? AND active=1
      ORDER BY position, id
    `,
      )
      .all(eventId);
  } else {
    const r = await db.pool.query(
      `
      SELECT id, event_id, base_price, min_price, max_price, current_price, active
      FROM event_beer WHERE event_id=$1 AND active=1
      ORDER BY position, id
    `,
      [eventId],
    );
    rows = r.rows;
  }

  if (!rows.length) return;

  const updated = raiseBoughtAndRebalance(rows as Row[], boughtBeerId, qty);

  // Persist
  if (db.kind === "memory") {
    const map = new Map(updated.map((u) => [u.id, u.current_price]));
    for (const b of db.mem.eventBeers) {
      if (b.event_id === eventId && map.has(b.id)) {
        b.current_price = map.get(b.id)!;
      }
    }
    for (const newRow of updated) {
      const oldRow = rows.find((r) => r.id === newRow.id);
      const oldPrice = oldRow ? Number(oldRow.current_price) : null;
      const newPrice = Number(newRow.current_price);
      await insertPriceUpdate(newRow.id, oldPrice, newPrice);
      console.log(
        `Price update for event_beer ${newRow.id}: ${oldPrice} -> ${newPrice}`,
      );
    }
  } else if (db.kind === "sqlite") {
    const stmt = db.sql.prepare(
      `UPDATE event_beer SET current_price=? WHERE id=?`,
    );
    const trx = db.sql.transaction((batch: Row[]) => {
      for (const r of batch) stmt.run(r.current_price, r.id);
    });
    trx(updated);
  } else {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      for (const r of updated) {
        await client.query(
          `UPDATE event_beer SET current_price=$1 WHERE id=$2`,
          [r.current_price, r.id],
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
export async function computeHouseFactor(eventId: string) {
  const { rows } = await db.pool.query(
    `
    SELECT
      SUM(qty * unit_price) AS total_income,
      SUM(qty * eb.base_price) AS fair_income
    FROM "transaction" t
    JOIN event_beer eb ON eb.id = t.event_beer_id
    WHERE t.event_id = $1
  `,
    [eventId],
  );

  const total = Number(rows[0].total_income || 0);
  const fair = Number(rows[0].fair_income || 0);
  if (fair === 0) return 1.0;

  const diff = total - fair;
  const ratio = diff / fair;
  // litt damping, så det ikke svinger for voldsomt:
  const factor = 1 + ratio * 0.1;
  return Math.max(0.8, Math.min(1.2, factor));
}
