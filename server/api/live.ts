import { Router } from "express";
import db from "../db/index.js";

export const live = Router();

live.get("/events/:eventId/stream", async (req, res) => {
  const { eventId } = req.params;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send heartbeat
  const keepAlive = setInterval(() => res.write(":\n\n"), 20000);

  // Hold connections i minne
  if (!globalThis.eventStreams) globalThis.eventStreams = new Map();
  const clients = globalThis.eventStreams.get(eventId) || new Set();
  clients.add(res);
  globalThis.eventStreams.set(eventId, clients);

  req.on("close", () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
});
