// server/repo/customers.repo.ts
import crypto from "node:crypto";
import db from "../db/index.js";
import {Customer} from "../db.js";

/**
 * Hent alle kunder for et event
 */
export async function listCustomers(eventId: string): Promise<Customer[]> {
  if (db.kind === "memory") {
    return db.mem.customers
      .filter((c) => c.event_id === eventId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const { rows } = await db.query("customers/listCustomers.sql", [eventId]);
  return rows;
}

/**
 * Opprett ny kunde
 */
export async function createCustomer(
  eventId: string,
  input: Partial<Customer>,
) {
  if (!input.name?.trim()) throw new Error("Customer name required");

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

  await db.query("customers/createCustomer.sql", [
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
  ]);

  return c;
}

/**
 * Oppdater kunde
 */
export async function updateCustomer(
  customerId: string,
  eventId: string,
  input: Partial<Customer>,
): Promise<Customer | null> {
  if (db.kind === "memory") {
    const i = db.mem.customers.findIndex(
      (x) => x.id === customerId && x.event_id === eventId,
    );
    if (i < 0) return null;
    db.mem.customers[i] = { ...db.mem.customers[i], ...input };
    return db.mem.customers[i];
  }

  // Finn eksisterende
  const { rows } = await db.query("customers/getCustomer.sql", [
    customerId,
    eventId,
  ]);
  const c = rows[0];
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

  await db.query("customers/updateCustomer.sql", [
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
  ]);

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
    return base.map((c) => ({
      ...c,
      beers: agg.get(c.id)?.beers || 0,
      tab: agg.get(c.id)?.tab || 0,
    }));
  }

  const { rows } = await db.query("customers/listCustomersWithStats.sql", [
    eventId,
  ]);
  return rows;
}

/**
 * Full detalj for kunde
 */
export async function getCustomerDetails(customerId: string, eventId: string) {
  if (db.kind === "memory") {
    const c = db.mem.customers.find(
      (x) => x.id === customerId && x.event_id === eventId,
    );
    if (!c)
      return {
        customer: null,
        summary: { beers: 0, tab: 0 },
        transactions: [],
      };

    const tx = db.mem.transactions.filter(
      (t) => t.event_id === eventId && t.customer_id === customerId,
    );
    const beers = tx.reduce((s, t) => s + (t.qty ?? 0), 0);
    const tab = tx.reduce((s, t) => s + (t.qty ?? 0) * (t.unit_price ?? 0), 0);
    return { customer: c, summary: { beers, tab }, transactions: tx };
  }

  const { rows: cRows } = await db.query("customers/getCustomer.sql", [
    customerId,
    eventId,
  ]);
  const customer = cRows[0] || null;
  if (!customer)
    return { customer: null, summary: { beers: 0, tab: 0 }, transactions: [] };

  const { rows: transactions } = await db.query(
    "customers/getCustomerTransactions.sql",
    [eventId, customerId],
  );
  const { rows: sumRows } = await db.query("customers/getCustomerSummary.sql", [
    eventId,
    customerId,
  ]);
  const summary = sumRows[0] || { beers: 0, tab: 0 };

  return { customer, summary, transactions };
}
