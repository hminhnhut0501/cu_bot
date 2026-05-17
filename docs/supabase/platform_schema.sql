-- CU BOT PLATFORM SCHEMA
-- Run this whole file in Supabase SQL Editor.
-- This resets bot platform tables and inserts minimal seed data for one bot.

drop table if exists audit_logs cascade;
drop table if exists bot_metrics cascade;
drop table if exists reputation_events cascade;
drop table if exists reputation_rules cascade;
drop table if exists scam_reports cascade;
drop table if exists scam_entities cascade;
drop table if exists scheduled_posts cascade;
drop table if exists auto_replies cascade;
drop table if exists captcha_questions cascade;
drop table if exists verification_settings cascade;
drop table if exists link_shorteners cascade;
drop table if exists domain_blacklist cascade;
drop table if exists module_settings cascade;
drop table if exists member_roles cascade;
drop table if exists video_messages cascade;
drop table if exists bot_allowlist cascade;
drop table if exists admins cascade;
drop table if exists keywords cascade;
drop table if exists messages cascade;
drop table if exists config cascade;
drop table if exists groups cascade;
drop table if exists bots cascade;

create table bots (
  id bigserial primary key,
  bot_key text not null unique,
  name text not null,
  username text,
  status text not null default 'active',
  owner_note text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table groups (
  id bigserial primary key,
  bot_key text not null default 'main',
  group_id text not null,
  group_name text,
  enabled boolean not null default true,
  delete_system_messages boolean default true,
  delete_forwarded_messages boolean default true,
  delete_inline_keyboard_messages boolean default true,
  delete_messages_from_bots boolean default true,
  remove_unknown_bots boolean default true,
  exempt_admins boolean default true,
  spam_max_messages integer default 6,
  spam_window_seconds integer default 12,
  spam_action text default 'warn',
  forward_action text default 'warn',
  inline_keyboard_action text default 'warn',
  ban_after_warnings integer default 3,
  warning_text text,
  daily_enabled boolean default true,
  daily_window_start text default '20:00',
  daily_window_end text default '23:59',
  send_if_silent boolean default false,
  message_pool text default 'default',
  video_enabled boolean default false,
  video_window_start text default '21:00',
  video_window_end text default '23:00',
  video_pool text default 'default',
  policy_text text,
  notes text
);

create table config (
  id bigserial primary key,
  bot_key text not null default 'main',
  key text not null,
  value text,
  enabled boolean not null default true,
  notes text,
  unique (bot_key, key)
);

create table module_settings (
  id bigserial primary key,
  bot_key text not null default 'main',
  module_key text not null,
  module_name text not null,
  category text not null,
  enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  notes text,
  unique (bot_key, module_key)
);

create table member_roles (
  id bigserial primary key,
  bot_key text not null default 'main',
  user_id text not null,
  chat_id text,
  username text,
  role text not null default 'member',
  reputation integer not null default 0,
  restricted_until timestamptz,
  enabled boolean not null default true,
  notes text
);

create table admins (
  id bigserial primary key,
  bot_key text not null default 'main',
  user_id text not null,
  chat_id text,
  role text not null default 'mod',
  enabled boolean not null default true,
  notes text
);

create table messages (
  id bigserial primary key,
  bot_key text not null default 'main',
  message text not null,
  pool text not null default 'default',
  weight integer not null default 1,
  enabled boolean not null default true,
  notes text
);

create table keywords (
  id bigserial primary key,
  bot_key text not null default 'main',
  keyword text not null,
  match text not null default 'contains',
  action text not null default 'delete',
  reason text,
  enabled boolean not null default true,
  notes text
);

create table domain_blacklist (
  id bigserial primary key,
  bot_key text not null default 'main',
  domain text not null,
  risk text not null default 'scam',
  action text not null default 'delete',
  enabled boolean not null default true,
  notes text
);

create table link_shorteners (
  id bigserial primary key,
  bot_key text not null default 'main',
  domain text not null,
  action text not null default 'warn',
  enabled boolean not null default true,
  notes text
);

create table verification_settings (
  id bigserial primary key,
  bot_key text not null default 'main',
  chat_id text,
  captcha_type text not null default 'math',
  verify_timeout_seconds integer not null default 180,
  kick_unverified boolean not null default true,
  delay_join_seconds integer not null default 0,
  enabled boolean not null default true,
  notes text
);

create table captcha_questions (
  id bigserial primary key,
  bot_key text not null default 'main',
  question text not null,
  answer text not null,
  enabled boolean not null default true,
  notes text
);

create table auto_replies (
  id bigserial primary key,
  bot_key text not null default 'main',
  trigger text not null,
  match text not null default 'contains',
  reply text not null,
  enabled boolean not null default true,
  notes text
);

create table scheduled_posts (
  id bigserial primary key,
  bot_key text not null default 'main',
  chat_id text not null,
  title text,
  content text not null,
  schedule_text text,
  enabled boolean not null default true,
  notes text
);

create table video_messages (
  id bigserial primary key,
  bot_key text not null default 'main',
  from_chat_id text not null,
  message_id text not null,
  caption text,
  pool text not null default 'default',
  weight integer not null default 1,
  enabled boolean not null default true,
  notes text
);

create table bot_allowlist (
  id bigserial primary key,
  bot_key text not null default 'main',
  bot_id text,
  username text,
  chat_id text,
  enabled boolean not null default true,
  notes text
);

create table scam_entities (
  id bigserial primary key,
  bot_key text not null default 'main',
  uid text,
  username text,
  bank_account text,
  phone text,
  name text,
  risk_level text not null default 'scam',
  reason text,
  evidence text,
  source text,
  status text not null default 'confirmed',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table scam_reports (
  id bigserial primary key,
  bot_key text not null default 'main',
  reporter_user_id text,
  reporter_username text,
  target_uid text,
  target_username text,
  bank_account text,
  phone text,
  evidence text,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now()
);

create table reputation_rules (
  id bigserial primary key,
  bot_key text not null default 'main',
  action_key text not null,
  points integer not null default 1,
  daily_limit integer,
  enabled boolean not null default true,
  notes text
);

create table reputation_events (
  id bigserial primary key,
  bot_key text not null default 'main',
  user_id text not null,
  chat_id text,
  action_key text not null,
  points integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id bigserial primary key,
  bot_key text not null default 'main',
  chat_id text,
  actor_user_id text,
  action text not null,
  target_user_id text,
  details text,
  created_at timestamptz not null default now()
);

create table bot_metrics (
  id bigserial primary key,
  bot_key text not null default 'main',
  metric_key text not null,
  metric_value integer not null default 0,
  period text not null default 'today',
  notes text,
  updated_at timestamptz not null default now()
);

alter table bots enable row level security;
alter table groups enable row level security;
alter table config enable row level security;
alter table module_settings enable row level security;
alter table member_roles enable row level security;
alter table admins enable row level security;
alter table messages enable row level security;
alter table keywords enable row level security;
alter table domain_blacklist enable row level security;
alter table link_shorteners enable row level security;
alter table verification_settings enable row level security;
alter table captcha_questions enable row level security;
alter table auto_replies enable row level security;
alter table scheduled_posts enable row level security;
alter table video_messages enable row level security;
alter table bot_allowlist enable row level security;
alter table scam_entities enable row level security;
alter table scam_reports enable row level security;
alter table reputation_rules enable row level security;
alter table reputation_events enable row level security;
alter table audit_logs enable row level security;
alter table bot_metrics enable row level security;

insert into bots (bot_key, name, username, enabled) values
  ('main', 'Bot chính', null, true);

insert into groups (bot_key, group_id, group_name, warning_text, policy_text, notes) values
  ('main', '-1002151486481', 'Hàng Cú chat', 'Cảnh báo: {reason} ({count}/{limit})', 'Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam hoặc quảng cáo.\n3. Không forward bài/video vào nhóm.\n4. Admin có quyền mute/kick/ban nếu vi phạm.', 'Sửa group_id trong CP nếu cần.');

insert into config (bot_key, key, value, enabled, notes) values
  ('main', 'policy_text', 'Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam hoặc quảng cáo.\n3. Không forward bài/video vào nhóm.', true, 'Nội quy mặc định.'),
  ('main', 'scam_review_channel_id', '', true, 'Channel nhận báo cáo scam đã duyệt hoặc báo cáo mới.'),
  ('main', 'delete_system_messages', 'true', true, 'Xóa tin join/leave/pin/đổi title.'),
  ('main', 'delete_forwarded_messages', 'true', true, 'Chặn tin forward.'),
  ('main', 'delete_inline_keyboard_messages', 'true', true, 'Chặn bài có nút bấm.'),
  ('main', 'delete_messages_from_bots', 'true', true, 'Chặn bot lạ gửi tin.'),
  ('main', 'remove_unknown_bots', 'true', true, 'Tự kick bot lạ.'),
  ('main', 'exempt_admins', 'true', true, 'Bỏ qua admin.'),
  ('main', 'scan_bio_links', 'true', true, 'Quét link Telegram trong bio.'),
  ('main', 'bio_link_delete_message', 'true', true, 'Xóa tin của member có link Telegram trong bio.'),
  ('main', 'bio_link_restrict_seconds', '0', true, '0 là mute cho đến khi admin check lại.'),
  ('main', 'bio_scan_cache_seconds', '3600', true, 'Cache kết quả quét bio.'),
  ('main', 'bio_link_warning_text', '{mention} vui lòng gỡ link Telegram trong bio rồi liên hệ admin để mở chat lại.', true, 'Tin cảnh báo bio link.'),
  ('main', 'spam_action', 'warn', true, 'Spam sẽ warn, đủ cảnh báo thì ban.'),
  ('main', 'spam_restrict_seconds', '300', true, 'Thời gian mute khi action mute/restrict.'),
  ('main', 'ban_seconds', '0', true, '0 là ban vĩnh viễn, >0 là ban theo thời gian.'),
  ('main', 'warning_notice_delete_seconds', '180', true, 'Xóa tin cảnh báo sau X giây.'),
  ('main', 'forward_warning_delete_seconds', '180', true, 'Xóa cảnh báo forward sau X giây.'),
  ('main', 'spam_notice_delete_seconds', '20', true, 'Xóa notice spam sau X giây.'),
  ('main', 'violation_delete_retry_seconds', '2', true, 'Retry xóa tin vi phạm sau X giây nếu lần đầu lỗi.'),
  ('main', 'captcha_text', '{mention} vui lòng xác minh trong {seconds}s: {question}', true, 'Tin captcha đơn giản.'),
  ('main', 'send_on_boot', 'false', true, 'Không gửi tin khi bot khởi động.'),
  ('main', 'send_if_silent', 'false', true, 'Chỉ gửi tin nếu nhóm có hoạt động.');

insert into module_settings (bot_key, module_key, module_name, category, enabled, settings, notes) values
  ('main', 'moderation', 'Kiểm duyệt cơ bản', 'Bảo mật', true, '{}'::jsonb, null),
  ('main', 'verification', 'Verify thành viên', 'Bảo mật', false, '{}'::jsonb, null),
  ('main', 'anti_scam', 'Tra cứu và báo cáo scam', 'Bảo mật', true, '{}'::jsonb, null),
  ('main', 'auto_reply', 'Auto reply', 'Tăng tương tác', true, '{}'::jsonb, null),
  ('main', 'reputation', 'Điểm tương tác', 'Tăng tương tác', true, '{}'::jsonb, null),
  ('main', 'analytics', 'Thống kê dashboard', 'Quản trị', true, '{}'::jsonb, null),
  ('main', 'scheduled_posts', 'Đăng bài định kỳ', 'Vận hành', true, '{}'::jsonb, null),
  ('main', 'monetization', 'Kiếm tiền / vận hành', 'Vận hành', false, '{}'::jsonb, null);

insert into admins (bot_key, user_id, chat_id, role, enabled, notes) values
  ('main', '887869657', '-1002151486481', 'owner', true, 'Owner'),
  ('main', '7344961485', null, 'mod', true, 'Mod toàn hệ thống'),
  ('main', '5080922525', null, 'mod', true, 'Mod toàn hệ thống');

insert into messages (bot_key, message, pool, weight, enabled, notes) values
  ('main', 'Bot đang hoạt động. Admin có thể sửa nội dung này trong control panel.', 'default', 1, true, 'Tin nhắn mặc định.');

insert into keywords (bot_key, keyword, match, action, reason, enabled, notes) values
  ('main', 'casino', 'contains', 'warn', 'Từ khóa cấm.', true, 'Spam/cờ bạc'),
  ('main', 'cá cược', 'contains', 'warn', 'Từ khóa cấm.', true, 'Spam/cờ bạc'),
  ('main', 'telegram.me/', 'contains', 'delete', 'Link Telegram đáng ngờ.', true, 'Link scam'),
  ('main', 't.me/spam', 'contains', 'ban', 'Link spam.', true, 'Link scam'),
  ('main', 'sex', 'contains', 'delete', 'Nội dung NSFW/porn bị chặn.', true, 'NSFW'),
  ('main', 'porn', 'contains', 'delete', 'Nội dung NSFW/porn bị chặn.', true, 'NSFW'),
  ('main', 'free money', 'contains', 'warn', 'Nội dung spam.', true, 'Spam');

insert into domain_blacklist (bot_key, domain, risk, action, enabled, notes) values
  ('main', 'telegram-login.example', 'telegram_clone', 'ban', true, 'Ví dụ domain clone Telegram'),
  ('main', 'scam.example', 'scam', 'ban', true, 'Ví dụ domain scam'),
  ('main', 'phishing.example', 'phishing', 'ban', true, 'Ví dụ domain phishing');

insert into link_shorteners (bot_key, domain, action, enabled, notes) values
  ('main', 'bit.ly', 'warn', true, 'Link rút gọn phổ biến'),
  ('main', 'tinyurl.com', 'warn', true, 'Link rút gọn phổ biến'),
  ('main', 'shorturl.at', 'warn', true, 'Link rút gọn phổ biến');

insert into verification_settings (bot_key, chat_id, captcha_type, verify_timeout_seconds, kick_unverified, delay_join_seconds, enabled, notes) values
  ('main', null, 'math', 180, true, 0, true, 'Captcha toán đơn giản cho mọi group của bot.');

insert into captcha_questions (bot_key, question, answer, enabled, notes) values
  ('main', '2 + 3 = ?', '5', true, 'Câu mẫu nếu cần dùng captcha cố định.');

insert into auto_replies (bot_key, trigger, match, reply, enabled, notes) values
  ('main', 'rule', 'contains', 'Bạn xem nội quy bằng lệnh /policy nhé.', true, 'Trả lời nội quy'),
  ('main', 'support', 'contains', 'Bạn vui lòng nhắn admin hoặc gửi mô tả vấn đề để được hỗ trợ.', true, 'Trả lời support'),
  ('main', 'giá', 'contains', 'Bạn vui lòng liên hệ admin để được báo giá chính xác.', true, 'Trả lời giá');

insert into scam_entities (bot_key, uid, username, bank_account, phone, name, risk_level, reason, evidence, source, status, enabled) values
  ('main', '123456789', 'scam_sample', '0123456789', '0900000000', 'Tài khoản mẫu', 'scam', 'Dữ liệu mẫu để test /check.', 'Bằng chứng mẫu.', 'seed', 'confirmed', true);

insert into reputation_rules (bot_key, action_key, points, daily_limit, enabled, notes) values
  ('main', 'message', 1, 20, true, 'Gửi tin nhắn'),
  ('main', 'help_member', 5, 10, true, 'Giúp đỡ thành viên'),
  ('main', 'check_in', 2, 1, true, 'Check-in hằng ngày');

insert into bot_metrics (bot_key, metric_key, metric_value, period, notes) values
  ('main', 'member_count', 0, 'today', 'Tổng member hiện tại'),
  ('main', 'active_members', 0, 'today', 'Member hoạt động'),
  ('main', 'deleted_messages', 0, 'today', 'Tin đã xóa'),
  ('main', 'spam_events', 0, 'today', 'Sự kiện spam'),
  ('main', 'scam_reports', 0, 'today', 'Báo cáo scam'),
  ('main', 'verified_members', 0, 'today', 'Member verify thành công');
