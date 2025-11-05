-- 005_price_update.sql
create table if not exists price_update (
  id uuid primary key default gen_random_uuid(),
  event_beer_id uuid not null references event_beer(id) on delete cascade,
  old_price numeric,
  new_price numeric not null,
  updated_at timestamptz not null default now()
);
