CREATE TABLE IF NOT EXISTS "transaction" (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_beer_id TEXT,
  customer_id TEXT,
  qty INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
  FOREIGN KEY (event_beer_id) REFERENCES event_beer(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE SET NULL
);
