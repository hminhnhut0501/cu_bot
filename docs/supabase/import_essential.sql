-- CU BOT - ESSENTIAL SUPABASE IMPORT
-- Run this whole file in Supabase SQL Editor.
-- This resets only the bot tables and inserts only the minimum useful data.

drop table if exists video_messages cascade;
drop table if exists bot_allowlist cascade;
drop table if exists admins cascade;
drop table if exists keywords cascade;
drop table if exists messages cascade;
drop table if exists config cascade;
drop table if exists groups cascade;

create table groups (
  id bigserial primary key,
  group_id text not null,
  group_name text,
  enabled boolean not null default true,
  delete_system_messages boolean,
  delete_forwarded_messages boolean,
  delete_inline_keyboard_messages boolean,
  delete_messages_from_bots boolean,
  remove_unknown_bots boolean,
  exempt_admins boolean,
  spam_max_messages integer,
  spam_window_seconds integer,
  spam_action text,
  forward_action text,
  inline_keyboard_action text,
  ban_after_warnings integer,
  warning_text text,
  daily_enabled boolean,
  daily_window_start text,
  daily_window_end text,
  send_if_silent boolean,
  message_pool text,
  video_enabled boolean,
  video_window_start text,
  video_window_end text,
  video_pool text,
  policy_text text,
  notes text
);

create table config (
  id bigserial primary key,
  key text not null unique,
  value text,
  enabled boolean not null default true,
  notes text
);

create table messages (
  id bigserial primary key,
  message text not null,
  pool text not null default 'default',
  weight integer not null default 1,
  enabled boolean not null default true,
  notes text
);

create table keywords (
  id bigserial primary key,
  keyword text not null,
  match text not null default 'contains',
  action text not null default 'warn',
  reason text,
  enabled boolean not null default true,
  notes text
);

create table admins (
  id bigserial primary key,
  user_id text not null,
  chat_id text,
  enabled boolean not null default true,
  notes text
);

create table bot_allowlist (
  id bigserial primary key,
  bot_id text,
  username text,
  chat_id text,
  enabled boolean not null default true,
  notes text
);

create table video_messages (
  id bigserial primary key,
  from_chat_id text not null,
  message_id text not null,
  caption text,
  pool text not null default 'default',
  weight integer not null default 1,
  enabled boolean not null default true,
  notes text
);

create index groups_enabled_group_id_idx on groups (enabled, group_id);
create index config_enabled_key_idx on config (enabled, key);
create index messages_enabled_pool_idx on messages (enabled, pool);
create index keywords_enabled_idx on keywords (enabled);
create index admins_enabled_chat_idx on admins (enabled, chat_id);
create index bot_allowlist_enabled_chat_idx on bot_allowlist (enabled, chat_id);
create index video_messages_enabled_pool_idx on video_messages (enabled, pool);

alter table groups enable row level security;
alter table config enable row level security;
alter table messages enable row level security;
alter table keywords enable row level security;
alter table admins enable row level security;
alter table bot_allowlist enable row level security;
alter table video_messages enable row level security;

insert into groups (
  group_id,
  group_name,
  enabled,
  delete_system_messages,
  delete_forwarded_messages,
  delete_inline_keyboard_messages,
  delete_messages_from_bots,
  remove_unknown_bots,
  exempt_admins,
  spam_max_messages,
  spam_window_seconds,
  spam_action,
  forward_action,
  inline_keyboard_action,
  ban_after_warnings,
  warning_text,
  daily_enabled,
  daily_window_start,
  daily_window_end,
  send_if_silent,
  message_pool,
  video_enabled,
  video_pool,
  notes
) values (
  '-1002151486481',
  'Hang Cu chat',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  3,
  12,
  'warn',
  'warn',
  'warn',
  3,
  'Canh bao: {reason} ({count}/{limit})',
  true,
  '20:00',
  '23:59',
  false,
  'default',
  false,
  'default',
  'Sua group_id/group_name trong control panel neu can.'
);

insert into config (key, value, enabled, notes) values
  (
    'policy_text',
    'Quy dinh nhom:\n1. Ton trong thanh vien.\n2. Khong spam hoac quang cao.\n3. Khong forward bai/video vao nhom.\n4. Admin co quyen mute/kick/ban neu vi pham.',
    true,
    'Noi quy hien khi go /policy.'
  ),
  ('send_on_boot', 'false', true, 'Khong gui tin ngay khi bot khoi dong.'),
  ('send_if_silent', 'false', true, 'Chi gui tin hang ngay neu group co hoat dong.');

insert into messages (message, pool, weight, enabled, notes) values
  (
    'Bot dang hoat dong. Admin co the sua noi dung nay trong control panel.',
    'default',
    1,
    true,
    'Tin nhan mac dinh duy nhat.'
  );

insert into admins (user_id, chat_id, enabled, notes) values
  ('887869657', '-1002151486481', true, 'Admin tu sheet'),
  ('7344961485', null, true, 'Admin global tu sheet'),
  ('5080922525', null, true, 'Admin global tu sheet');

select 'groups' as table_name, count(*) as row_count from groups;
select 'config' as table_name, count(*) as row_count from config;
select 'messages' as table_name, count(*) as row_count from messages;
select 'keywords' as table_name, count(*) as row_count from keywords;
select 'admins' as table_name, count(*) as row_count from admins;
select 'bot_allowlist' as table_name, count(*) as row_count from bot_allowlist;
select 'video_messages' as table_name, count(*) as row_count from video_messages;
