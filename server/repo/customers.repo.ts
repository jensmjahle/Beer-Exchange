// server/repo/customers.repo.ts
import crypto from "node:crypto";
import db, { Customer } from "../db/index.js";

/**
 * Finn alle kunder for et event
 */
export async function listCustomers(eventId: string): Promise<Customer[]> {
  if (db.kind === "memory") {
    return db.mem.customers
      .filter((c) => c.event_id === eventId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  if (db.kind === "sqlite") {
    return db.sql
      .prepare(
        `
      SELECT id,event_id,name,phone,
             shoe_size,weight,profile_image_url,work_relationship,
             gender,sexual_orientation,ethnicity,experience_level
      FROM customer
      WHERE event_id=?
      ORDER BY name
    `,
      )
      .all(eventId);
  }
  const { rows } = await db.pool.query(
    `
    SELECT id,event_id,name,phone,
           shoe_size,weight,profile_image_url,work_relationship,
           gender,sexual_orientation,ethnicity,experience_level
    FROM customer
    WHERE event_id=$1
    ORDER BY name
  `,
    [eventId],
  );
  return rows;
}

/**
 * Beregn kurtasje-prosent basert på jobbstatus
 */
export function getKurtasjePct(work_relationship?: string | null): number {
  switch ((work_relationship ?? "").toLowerCase()) {
    case "student":
      return 0.02;
    case "staff":
      return 0.03;
    case "vip":
      return 0.01;
    default:
      return 0.05;
  }
}

/**
 * Opprett ny kunde
 */
type CreateCustomerInput = {
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

export async function createCustomer(
  eventId: string,
  input: CreateCustomerInput,
): Promise<Customer> {
  if (!input.name || !input.name.trim()) {
    throw new Error("Customer name required");
  }
  const c: Customer = {
    id: crypto.randomUUID(),
    event_id: eventId,
    name: input.name.trim(),
    phone: input.phone ?? null,
    shoe_size: input.shoe_size ?? null,
    weight: input.weight ?? null,
    profile_image_url: input.profile_image_url ?? null,
    work_relationship: input.work_relationship ?? null,
    gender: input.gender ?? null,
    sexual_orientation: input.sexual_orientation ?? null,
    ethnicity: input.ethnicity ?? null,
    experience_level: input.experience_level ?? null,
  };

  if (db.kind === "memory") {
    db.mem.customers.push(c);
    return c;
  }

  if (db.kind === "sqlite") {
    db.sql
      .prepare(
        `
      INSERT INTO customer (
        id,event_id,name,phone,
        shoe_size,weight,profile_image_url,work_relationship,
        gender,sexual_orientation,ethnicity,experience_level
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `,
      )
      .run(
        c.id,
        c.event_id,
        c.name,
        c.phone,
        c.shoe_size,
        c.weight,
        c.profile_image_url,
        c.work_relationship,
        c.gender,
        c.sexual_orientation,
        c.ethnicity,
        c.experience_level,
      );
    return c;
  }

  await db.pool.query(
    `
    INSERT INTO customer (
      id,event_id,name,phone,
      shoe_size,weight,profile_image_url,work_relationship,
      gender,sexual_orientation,ethnicity,experience_level
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  `,
    [
      c.id,
      c.event_id,
      c.name,
      c.phone,
      c.shoe_size,
      c.weight,
      c.profile_image_url,
      c.work_relationship,
      c.gender,
      c.sexual_orientation,
      c.ethnicity,
      c.experience_level,
    ],
  );
  return c;
}

/**
 * Oppdater kunde
 */
type UpdateCustomerInput = Partial<CreateCustomerInput> & { name?: string };

export async function updateCustomer(
  customerId: string,
  eventId: string,
  input: UpdateCustomerInput,
): Promise<Customer | null> {
  if (db.kind === "memory") {
    const i = db.mem.customers.findIndex(
      (x) => x.id === customerId && x.event_id === eventId,
    );
    if (i < 0) return null;
    const prev = db.mem.customers[i];
    const next: Customer = {
      ...prev,
      name: input.name ?? prev.name,
      phone: input.phone ?? prev.phone,
      shoe_size: input.shoe_size ?? prev.shoe_size,
      weight: input.weight ?? prev.weight,
      profile_image_url: input.profile_image_url ?? prev.profile_image_url,
      work_relationship: input.work_relationship ?? prev.work_relationship,
      gender: input.gender ?? prev.gender,
      sexual_orientation: input.sexual_orientation ?? prev.sexual_orientation,
      ethnicity: input.ethnicity ?? prev.ethnicity,
      experience_level: input.experience_level ?? prev.experience_level,
    };
    db.mem.customers[i] = next;
    return next;
  }

  if (db.kind === "sqlite") {
    const c = db.sql
      .prepare(`SELECT * FROM customer WHERE id=? AND event_id=?`)
      .get(customerId, eventId);
    if (!c) return null;
    const next = {
      name: input.name ?? c.name,
      phone: input.phone ?? c.phone,
      shoe_size: input.shoe_size ?? c.shoe_size,
      weight: input.weight ?? c.weight,
      profile_image_url: input.profile_image_url ?? c.profile_image_url,
      work_relationship: input.work_relationship ?? c.work_relationship,
      gender: input.gender ?? c.gender,
      sexual_orientation: input.sexual_orientation ?? c.sexual_orientation,
      ethnicity: input.ethnicity ?? c.ethnicity,
      experience_level: input.experience_level ?? c.experience_level,
    };
    db.sql
      .prepare(
        `
      UPDATE customer
      SET name=?, phone=?, shoe_size=?, weight=?, profile_image_url=?, work_relationship=?,
          gender=?, sexual_orientation=?, ethnicity=?, experience_level=?
      WHERE id=? AND event_id=?
    `,
      )
      .run(
        next.name,
        next.phone,
        next.shoe_size,
        next.weight,
        next.profile_image_url,
        next.work_relationship,
        next.gender,
        next.sexual_orientation,
        next.ethnicity,
        next.experience_level,
        customerId,
        eventId,
      );
    return { ...c, ...next };
  }

  // pg
  const { rows: currRows } = await db.pool.query(
    `SELECT * FROM customer WHERE id=$1 AND event_id=$2`,
    [customerId, eventId],
  );
  const c = currRows[0];
  if (!c) return null;
  const next = {
    name: input.name ?? c.name,
    phone: input.phone ?? c.phone,
    shoe_size: input.shoe_size ?? c.shoe_size,
    weight: input.weight ?? c.weight,
    profile_image_url: input.profile_image_url ?? c.profile_image_url,
    work_relationship: input.work_relationship ?? c.work_relationship,
    gender: input.gender ?? c.gender,
    sexual_orientation: input.sexual_orientation ?? c.sexual_orientation,
    ethnicity: input.ethnicity ?? c.ethnicity,
    experience_level: input.experience_level ?? c.experience_level,
  };
  await db.pool.query(
    `
    UPDATE customer
    SET name=$1, phone=$2, shoe_size=$3, weight=$4, profile_image_url=$5, work_relationship=$6,
        gender=$7, sexual_orientation=$8, ethnicity=$9, experience_level=$10
    WHERE id=$11 AND event_id=$12
  `,
    [
      next.name,
      next.phone,
      next.shoe_size,
      next.weight,
      next.profile_image_url,
      next.work_relationship,
      next.gender,
      next.sexual_orientation,
      next.ethnicity,
      next.experience_level,
      customerId,
      eventId,
    ],
  );
  return { ...c, ...next };
}

/**
 * Hent kunder + summeringer (beers/tab)
 */
export async function listCustomersWithStats(eventId: string) {
  if (db.kind === "memory") {
    const base = await listCustomers(eventId);
    const tx = db.mem.transactions.filter(
      (t) => t.event_id === eventId && t.customer_id,
    );
    const agg = new Map<string, { beers: number; tab: number }>();
    for (const t of tx) {
      const k = String(t.customer_id);
      const cur = agg.get(k) || { beers: 0, tab: 0 };
      cur.beers += Number(t.qty || 0);
      cur.tab += Number(t.qty || 0) * Number(t.unit_price || 0);
      agg.set(k, cur);
    }
    return base
      .map((c) => ({
        ...c,
        beers: agg.get(c.id)?.beers || 0,
        tab: agg.get(c.id)?.tab || 0,
      }))
      .sort((a, b) => b.tab - a.tab || a.name.localeCompare(b.name));
  }

  if (db.kind === "sqlite") {
    return db.sql
      .prepare(
        `
      SELECT
        c.id, c.event_id, c.name, c.phone,
        c.shoe_size, c.weight, c.profile_image_url, c.work_relationship,
        c.gender, c.sexual_orientation, c.ethnicity, c.experience_level,
        COALESCE(SUM(t.qty),0) AS beers,
        COALESCE(SUM(t.qty * t.unit_price),0) AS tab
      FROM customer c
      LEFT JOIN "transaction" t ON t.customer_id = c.id AND t.event_id = c.event_id
      WHERE c.event_id = ?
      GROUP BY c.id
      ORDER BY tab DESC, name ASC
    `,
      )
      .all(eventId);
  }

  const { rows } = await db.pool.query(
    `
    SELECT
      c.id, c.event_id, c.name, c.phone,
      c.shoe_size, c.weight, c.profile_image_url, c.work_relationship,
      c.gender, c.sexual_orientation, c.ethnicity, c.experience_level,
      COALESCE(SUM(t.qty),0) AS beers,
      COALESCE(SUM(t.qty * t.unit_price),0) AS tab
    FROM customer c
    LEFT JOIN "transaction" t ON t.customer_id = c.id AND t.event_id = c.event_id
    WHERE c.event_id = $1
    GROUP BY c.id
    ORDER BY tab DESC, name ASC
  `,
    [eventId],
  );
  return rows;
}

/**
 * Full detalj for kunde
 */
export async function getCustomerDetails(customerId: string, eventId: string) {
  if (db.kind === "memory") {
    const customer =
      db.mem.customers.find(
        (c) => c.id === customerId && c.event_id === eventId,
      ) || null;
    if (!customer)
      return {
        customer: null,
        summary: { beers: 0, tab: 0 },
        transactions: [],
      };

    const tx = db.mem.transactions
      .filter((t) => t.event_id === eventId && t.customer_id === customerId)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

    const byBeer = new Map(db.mem.eventBeers.map((b) => [b.id, b]));
    const transactions = tx.map((t) => ({
      id: t.id,
      qty: Number(t.qty || 0),
      unit_price: Number(t.unit_price || 0),
      ts: t.created_at,
      beer_name: byBeer.get(t.event_beer_id || "")?.name ?? null,
      beer_id: byBeer.get(t.event_beer_id || "")?.beer_id ?? null,
    }));

    const beers = tx.reduce((s, t) => s + Number(t.qty || 0), 0);
    const tab = tx.reduce(
      (s, t) => s + Number(t.qty || 0) * Number(t.unit_price || 0),
      0,
    );
    return { customer, summary: { beers, tab }, transactions };
  }

  if (db.kind === "sqlite") {
    const customer = db.sql
      .prepare(
        `
      SELECT id,event_id,name,phone,
             shoe_size,weight,profile_image_url,work_relationship,
             gender,sexual_orientation,ethnicity,experience_level
      FROM customer WHERE id=? AND event_id=?
    `,
      )
      .get(customerId, eventId);
    if (!customer)
      return {
        customer: null,
        summary: { beers: 0, tab: 0 },
        transactions: [],
      };

    const transactions = db.sql
      .prepare(
        `
      SELECT
        t.id, t.qty, t.unit_price, t.created_at AS ts,
        eb.name AS beer_name, eb.beer_id AS beer_id
      FROM "transaction" t
      LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
      WHERE t.event_id = ? AND t.customer_id = ?
      ORDER BY datetime(t.created_at) DESC
    `,
      )
      .all(eventId, customerId);

    const summary = db.sql
      .prepare(
        `
      SELECT COALESCE(SUM(t.qty),0) AS beers, COALESCE(SUM(t.qty * t.unit_price),0) AS tab
      FROM "transaction" t WHERE t.event_id = ? AND t.customer_id = ?
    `,
      )
      .get(eventId, customerId);

    return { customer, summary, transactions };
  }

  const { rows: cRows } = await db.pool.query(
    `
    SELECT id,event_id,name,phone,
           shoe_size,weight,profile_image_url,work_relationship,
           gender,sexual_orientation,ethnicity,experience_level
    FROM customer WHERE id=$1 AND event_id=$2
  `,
    [customerId, eventId],
  );
  const customer = cRows[0] || null;
  if (!customer)
    return { customer: null, summary: { beers: 0, tab: 0 }, transactions: [] };

  const { rows: transactions } = await db.pool.query(
    `
    SELECT
      t.id, t.qty, t.unit_price, t.created_at AS ts,
      eb.name AS beer_name, eb.beer_id AS beer_id
    FROM "transaction" t
    LEFT JOIN event_beer eb ON eb.id = t.event_beer_id
    WHERE t.event_id = $1 AND t.customer_id = $2
    ORDER BY t.created_at DESC
  `,
    [eventId, customerId],
  );

  const { rows: sumRows } = await db.pool.query(
    `
    SELECT COALESCE(SUM(t.qty),0) AS beers, COALESCE(SUM(t.qty * t.unit_price),0) AS tab
    FROM "transaction" t WHERE t.event_id = $1 AND t.customer_id = $2
  `,
    [eventId, customerId],
  );

  const summary = sumRows[0] || { beers: 0, tab: 0 };
  return { customer, summary, transactions };
}
