-- CU BOT - SUPABASE RESET AND SEED
-- Run this in Supabase Dashboard -> SQL Editor.
--
-- WARNING: This script drops and recreates the bot configuration tables.
-- Replace placeholder IDs after running:
--   -1001234567890  -> your Telegram group_id
--   123456789       -> your Telegram admin user_id

begin;

drop table if exists video_messages cascade;
drop table if exists bot_allowlist cascade;
drop table if exists admins cascade;
drop table if exists keywords cascade;
drop table if exists messages cascade;
drop table if exists config cascade;
drop table if exists groups cascade;

create table groups (
  id bigserial primary key,
  group_id text not null unique,
  group_name text,
  enabled boolean not null default true,
  moderation_enabled boolean not null default true,
  daily_enabled boolean not null default true,
  daily_window_start text not null default '20:00',
  daily_window_end text not null default '23:59',
  send_if_silent boolean not null default false,
  message_pool text not null default 'default',
  video_enabled boolean not null default false,
  video_window_start text not null default '20:00',
  video_window_end text not null default '23:00',
  video_pool text not null default 'default',
  spam_max_messages integer,
  spam_window_seconds integer,
  media_spam_max_messages integer,
  media_spam_window_seconds integer,
  spam_action text,
  media_spam_action text,
  delete_system_messages boolean,
  delete_forwarded_messages boolean,
  delete_inline_keyboard_messages boolean,
  delete_messages_from_bots boolean,
  remove_unknown_bots boolean,
  scan_bio_links boolean,
  bio_link_delete_message boolean,
  exempt_admins boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table config (
  id bigserial primary key,
  key text not null unique,
  value text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id bigserial primary key,
  message text not null,
  pool text not null default 'default',
  weight integer not null default 1,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table keywords (
  id bigserial primary key,
  keyword text not null,
  match text not null default 'contains',
  action text not null default 'warn',
  delete boolean not null default true,
  reason text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint keywords_match_check check (match in ('contains', 'regex')),
  constraint keywords_action_check check (action in ('delete', 'warn', 'ban'))
);

create table admins (
  id bigserial primary key,
  user_id text not null,
  chat_id text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, chat_id)
);

create table bot_allowlist (
  id bigserial primary key,
  bot_id text,
  username text,
  chat_id text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table video_messages (
  id bigserial primary key,
  from_chat_id text not null,
  message_id text not null,
  caption text,
  pool text not null default 'default',
  weight integer not null default 1,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (from_chat_id, message_id, pool)
);

create index groups_enabled_idx on groups (enabled);
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
  moderation_enabled,
  daily_enabled,
  daily_window_start,
  daily_window_end,
  send_if_silent,
  message_pool,
  video_enabled,
  video_window_start,
  video_window_end,
  video_pool,
  spam_max_messages,
  spam_window_seconds,
  media_spam_max_messages,
  media_spam_window_seconds,
  spam_action,
  media_spam_action,
  notes
) values (
  '-1001234567890',
  'Nhom Telegram cua ban',
  true,
  true,
  true,
  '20:00',
  '23:59',
  false,
  'default',
  false,
  '21:00',
  '23:00',
  'default',
  6,
  12,
  3,
  10,
  'warn',
  'restrict',
  'Thay group_id bang chat_id that cua group.'
);

insert into config (key, value, enabled, notes) values
  ('policy_text', 'Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam, quảng cáo, kéo mem.\n3. Không gửi link Telegram trong bio hoặc tin nhắn.\n4. Không forward bài/video từ nơi khác vào nhóm.\n5. Vi phạm nhiều lần có thể bị cấm khỏi nhóm.', true, 'Noi quy hien khi go /policy'),
  ('delete_system_messages', 'true', true, 'Xoa tin service: user join/leave, doi ten nhom...'),
  ('delete_forwarded_messages', 'true', true, 'Xoa tin forward vao group'),
  ('forward_action', 'warn', true, 'delete, warn, ban'),
  ('forward_warning_reason', 'Không được forward video/bài vào nhóm.', true, null),
  ('forward_warning_text', '{mention} vui lòng không forward video/bài vào nhóm. ({count}/{limit})', true, null),
  ('forward_warning_delete_seconds', '180', true, null),
  ('delete_inline_keyboard_messages', 'true', true, 'Xoa bai co inline keyboard'),
  ('inline_keyboard_action', 'warn', true, 'delete, warn, ban'),
  ('delete_messages_from_bots', 'true', true, 'Xoa tin tu bot la neu bot khong nam trong allowlist'),
  ('remove_unknown_bots', 'true', true, 'Kick/ban bot la khi bi add vao nhom'),
  ('scan_bio_links', 'true', true, 'Quet link Telegram trong bio'),
  ('bio_link_delete_message', 'true', true, 'Xoa tin cua user co link Telegram trong bio'),
  ('bio_scan_cache_seconds', '3600', true, null),
  ('bio_link_restrict_seconds', '0', true, '0 la restrict vo thoi han den khi admin /checkbio lai'),
  ('bio_link_warning_text', '{mention} vui lòng gỡ link Telegram trong bio rồi liên hệ admin để mở chat lại.', true, null),
  ('bio_link_notice_delete_seconds', '30', true, null),
  ('exempt_admins', 'true', true, 'Bo qua filter voi admin Telegram/admin trong bang admins'),
  ('spam_max_messages', '6', true, null),
  ('spam_window_seconds', '12', true, null),
  ('spam_action', 'warn', true, 'delete, warn, ban'),
  ('media_spam_max_messages', '3', true, null),
  ('media_spam_window_seconds', '10', true, null),
  ('media_spam_action', 'restrict', true, 'restrict, delete, warn, ban'),
  ('spam_restrict_seconds', '300', true, null),
  ('spam_restrict_text', '{mention} bị tạm cấm chat vì {reason}', true, null),
  ('spam_notice_delete_seconds', '20', true, null),
  ('warning_text', 'Cảnh báo {mention}: {reason} ({count}/{limit})', true, null),
  ('warning_notice_delete_seconds', '180', true, null),
  ('violation_delete_retry_seconds', '2', true, null),
  ('ban_after_warnings', '3', true, null),
  ('daily_window_start', '20:00', true, 'Gio bat dau gui tin moi ngay'),
  ('daily_window_end', '23:59', true, 'Gio ket thuc gui tin moi ngay'),
  ('send_if_silent', 'false', true, 'false: chi gui neu hom do group co hoat dong'),
  ('send_on_boot', 'false', true, 'true: gui tin ngay khi bot khoi dong');

insert into messages (message, pool, weight, enabled, notes) values
  ('Chào cả nhà, chúc mọi người một ngày vui vẻ.', 'default', 1, true, null),
  ('Nhắc nhẹ: mọi người đọc nội quy bằng lệnh /policy nếu cần.', 'default', 1, true, null),
  ('Group hoạt động vui vẻ, lịch sự, không spam nhé mọi người.', 'default', 1, true, null),
  ('Ai cần hỗ trợ thì tag admin, hạn chế gửi link lạ vào nhóm.', 'default', 1, true, null);

insert into keywords (keyword, match, action, delete, reason, enabled, notes) values
  ('casino', 'contains', 'warn', true, 'Từ khóa cấm.', true, null),
  ('cá độ', 'contains', 'warn', true, 'Từ khóa cấm.', true, null),
  ('telegram.me/', 'contains', 'warn', true, 'Không gửi link Telegram trong nhóm.', true, null),
  ('t.me/', 'contains', 'warn', true, 'Không gửi link Telegram trong nhóm.', true, null),
  ('https?://[^\\s]*(casino|bet|cacuoc|nhacai)', 'regex', 'ban', true, 'Link spam/cờ bạc.', true, 'Regex da duoc normalize bo dau trong code bot.');

insert into admins (user_id, chat_id, enabled, notes) values
  ('123456789', '-1001234567890', true, 'Thay user_id va chat_id bang admin that.');

insert into bot_allowlist (bot_id, username, chat_id, enabled, notes) values
  (null, 'GroupAnonymousBot', null, true, 'Vi du allow bot theo username. Co the xoa neu khong can.');

insert into video_messages (from_chat_id, message_id, caption, pool, weight, enabled, notes) values
  ('-1009876543210', '456', null, 'default', 1, false, 'Dong mau dang tat. Bat enabled sau khi thay source chat/message that.');

commit;
