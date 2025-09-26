CREATE TABLE IF NOT EXISTS event_beer (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  beer_id TEXT NOT NULL,
  name TEXT,
  base_price REAL NOT NULL,
  min_price REAL NOT NULL,
  max_price REAL NOT NULL,
  current_price REAL NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE
);
