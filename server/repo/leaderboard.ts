import db from "../db/index.js";

/** 🥇 Mest væske konsumert (L) */
export async function getTopVolume(eventId: string) {
  const { rows } = await db.query("leaderboard/topVolume.sql", [eventId]);
  return rows;
}

/** 💰 Høyest barregning (NOK) */
export async function getTopSpend(eventId: string) {
  const { rows } = await db.query("leaderboard/topSpend.sql", [eventId]);
  return rows;
}

/** 🍻 Top fyllesvin (beregnet promille ‰) */
export async function getTopBac(eventId: string) {
  const { rows } = await db.query("leaderboard/topBac.sql", [eventId]);
  return rows;
}
