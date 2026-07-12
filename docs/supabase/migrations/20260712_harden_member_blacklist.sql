-- Harden member blacklist.
-- Safe to run multiple times on production Supabase.

alter table analytics_member_activity
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists message_count integer not null default 1;

create table if not exists member_moderation_state (
  id bigserial primary key,
  bot_key text not null default 'main',
  chat_id text not null,
  user_id text not null,
  username text,
  display_name text,
  status text not null default 'normal',
  reason text,
  until_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  unique (bot_key, chat_id, user_id)
);

create index if not exists idx_member_moderation_state_bot_chat_status
  on member_moderation_state (bot_key, chat_id, status);

create index if not exists idx_member_moderation_state_bot_user
  on member_moderation_state (bot_key, user_id);

create index if not exists idx_member_moderation_state_global_blacklist
  on member_moderation_state (bot_key, user_id)
  where chat_id = '*' and status = 'blacklisted';

create index if not exists idx_member_moderation_state_system_blacklist
  on member_moderation_state (user_id)
  where bot_key = '*' and chat_id = '*' and status = 'blacklisted';

comment on table member_moderation_state is
  'Per-chat, bot-global, and system-global member moderation state. bot_key = * and chat_id = * means blacklist applies to every bot and every group/channel.';

alter table member_moderation_state enable row level security;
