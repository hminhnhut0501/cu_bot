-- Daily analytics snapshots for operation dashboards.
-- Additive migration: safe to run on an existing database.

create table if not exists analytics_daily_stats (
  id bigserial primary key,
  bot_key text not null default 'main',
  chat_id text not null default '',
  stat_date date not null,
  joins integer not null default 0,
  leaves integer not null default 0,
  net_growth integer not null default 0,
  join_requests integer not null default 0,
  deleted_messages integer not null default 0,
  delete_failures integer not null default 0,
  warns integer not null default 0,
  restricts integer not null default 0,
  bans integer not null default 0,
  kicks integer not null default 0,
  verified_members integer not null default 0,
  violations integer not null default 0,
  unique_violators integer not null default 0,
  scam_reports integer not null default 0,
  scam_pending integer not null default 0,
  scam_confirmed integer not null default 0,
  scam_rejected integer not null default 0,
  active_members integer not null default 0,
  member_count integer not null default 0,
  member_count_checked_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (bot_key, chat_id, stat_date)
);

create table if not exists analytics_member_activity (
  id bigserial primary key,
  bot_key text not null default 'main',
  chat_id text not null,
  user_id text not null,
  activity_date date not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  message_count integer not null default 1,
  unique (bot_key, chat_id, user_id, activity_date)
);

create index if not exists idx_analytics_daily_stats_bot_date
  on analytics_daily_stats (bot_key, stat_date desc);

create index if not exists idx_analytics_daily_stats_bot_chat_date
  on analytics_daily_stats (bot_key, chat_id, stat_date desc);

create index if not exists idx_analytics_member_activity_bot_date
  on analytics_member_activity (bot_key, activity_date desc);

create index if not exists idx_analytics_member_activity_bot_chat_date
  on analytics_member_activity (bot_key, chat_id, activity_date desc);

alter table analytics_daily_stats enable row level security;
alter table analytics_member_activity enable row level security;
