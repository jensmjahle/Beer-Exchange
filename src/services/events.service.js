import { authedFetch } from "./authService";

const BASE = "/api";

async function parse(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function listEvents() {
  const res = await fetch(`${BASE}/events`);
  return parse(res);
}

export async function getEvent(eventId) {
  const res = await fetch(`${BASE}/events/${encodeURIComponent(eventId)}`);
  return parse(res);
}

// formData: name, currency, startLive, (optional) image (File)
// NOTE: must be FormData (multipart)
export async function createEventMultipart(formData) {
  const res = await authedFetch(`${BASE}/events`, {
    method: "POST",
    body: formData,
  });
  return parse(res);
}

export async function createEvent(payload) {
  const res = await authedFetch(`${BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

// (Optional) update helpers if/when you add server routes later:
// export async function updateEvent(eventId, patch) { ... }
// export async function uploadEventImage(eventId, file) { ... }
