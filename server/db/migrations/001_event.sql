
create table if not exists event (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null,
  status text not null check (status in ('draft','live','closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  image_url text,
  live boolean not null default false
);
