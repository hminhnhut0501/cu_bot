alter table channel_posts
  add column if not exists scheduled_at timestamptz,
  add column if not exists delete_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists created_by text,
  add column if not exists deleted_by text,
  add column if not exists error_code text;

create table if not exists channel_post_events (
  id bigserial primary key,
  bot_key text not null default 'main',
  channel_post_id bigint references channel_posts(id) on delete cascade,
  event_type text not null,
  message text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists channel_posts_status_schedule_idx
  on channel_posts (bot_key, status, scheduled_at);

create index if not exists channel_posts_delete_schedule_idx
  on channel_posts (bot_key, status, delete_at);

create index if not exists channel_post_events_post_idx
  on channel_post_events (channel_post_id, created_at desc);

alter table channel_post_events enable row level security;
