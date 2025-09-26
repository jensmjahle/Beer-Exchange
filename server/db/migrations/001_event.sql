CREATE TABLE IF NOT EXISTS event (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','live','closed')),
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL,
  image_url TEXT
);
