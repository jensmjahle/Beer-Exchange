create table if not exists transaction (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references event(id) on delete cascade,
  event_beer_id uuid references event_beer(id) on delete set null,
  customer_id uuid references customer(id) on delete set null,
  qty integer not null,
  unit_price numeric not null,
  volume_ml numeric,
  created_at timestamptz not null default now()
);
