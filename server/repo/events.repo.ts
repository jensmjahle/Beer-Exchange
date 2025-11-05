// server/repo/events.repo.ts
import db from "../db/index.js";
import crypto from "node:crypto";

export async function listEvents() {
  if (db.kind === "memory") return db.listEvents();
  const { rows } = await db.query("events/listEvents.sql");
  return rows;
}

export async function getEvent(id: string) {
  if (db.kind === "memory") return db.getEvent(id);
  const { rows } = await db.query("events/getEvent.sql", [id]);
  return rows[0] ?? null;
}

export async function createEvent(p) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const ev = {
    id,
    name: p.name,
    currency: p.currency,
    status: p.startLive ? "live" : "draft",
    starts_at: p.startLive ? now : null,
    ends_at: null,
    created_at: now,
    image_url: p.image_url ?? null,
  };

  if (db.kind === "memory") {
    db.createEvent(ev);
    return ev;
  }

  await db.query("events/createEvent.sql", [
    ev.id,
    ev.name,
    ev.currency,
    ev.status,
    ev.starts_at,
    ev.ends_at,
    ev.created_at,
    ev.image_url,
  ]);
  return ev;
}
