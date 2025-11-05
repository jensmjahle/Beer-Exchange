create table if not exists customer (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references event(id) on delete cascade,
  name text not null,
  phone text,
  shoe_size text,
  weight text,
  profile_image_url text,
  work_relationship text,
  gender text,
  sexual_orientation text,
  ethnicity text,
  experience_level text
);
