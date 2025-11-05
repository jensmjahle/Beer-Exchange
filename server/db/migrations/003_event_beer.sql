-- 003_event_beer.sql

CREATE TABLE IF NOT EXISTS event_beer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brewery TEXT,
  style TEXT,
  abv NUMERIC,
  ibu NUMERIC,
  description TEXT,
  image_url TEXT,
  volumes JSONB NOT NULL DEFAULT '[]', -- f.eks. [{ "ml": 330, "stock": 24 }, { "ml": 500, "stock": 12 }]
  base_price NUMERIC NOT NULL,
  min_price NUMERIC NOT NULL,
  max_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
