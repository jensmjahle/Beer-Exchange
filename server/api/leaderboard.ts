import { Router } from "express";
import {getTopBac, getTopSpend, getTopVolume} from "../repo/leaderboard.js";


export const leaderboard = Router();

// 🥇 Mest væske konsumert
leaderboard.get("/event/:eventId/top-volume", async (req, res) => {
  try {
    const result = await getTopVolume(req.params.eventId);
    res.json(result);
  } catch (e) {
    console.error("[leaderboard:volume] failed", e);
    res.status(500).json({ error: "Failed to load volume leaderboard" });
  }
});

// 💰 Høyest barregning
leaderboard.get("/event/:eventId/top-spend", async (req, res) => {
  try {
    const result = await getTopSpend(req.params.eventId);
    res.json(result);
  } catch (e) {
    console.error("[leaderboard:spend] failed", e);
    res.status(500).json({ error: "Failed to load spend leaderboard" });
  }
});

// 🍻 Top fyllesvin
leaderboard.get("/event/:eventId/top-bac", async (req, res) => {
  try {
    const result = await getTopBac(req.params.eventId);
    res.json(result);
  } catch (e) {
    console.error("[leaderboard:bac] failed", e);
    res.status(500).json({ error: "Failed to load BAC leaderboard" });
  }
});
