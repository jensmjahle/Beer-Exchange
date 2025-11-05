-- 006_admin.sql
create table if not exists admin_user (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('SUPERUSER', 'MODERATOR')),
  created_at timestamptz not null default now()
);
