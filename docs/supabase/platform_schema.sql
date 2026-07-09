-- CU BOT PLATFORM SCHEMA
-- Run this whole file in Supabase SQL Editor.
-- This resets bot platform tables and inserts minimal seed data for one bot.

drop table if exists audit_logs cascade;
drop table if exists analytics_member_activity cascade;
drop table if exists analytics_daily_stats cascade;
drop table if exists bot_metrics cascade;
drop table if exists giveaway_entries cascade;
drop table if exists giveaway_campaigns cascade;
drop table if exists entertainment_events cascade;
drop table if exists reputation_events cascade;
drop table if exists reputation_rules cascade;
drop table if exists scam_reports cascade;
drop table if exists scam_entities cascade;
drop table if exists channel_posts cascade;
drop table if exists channel_post_events cascade;
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
  bot_token text,
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
  moderation_enabled boolean default true,
  delete_system_messages boolean default true,
  delete_forwarded_messages boolean default true,
  delete_inline_keyboard_messages boolean default true,
  delete_messages_from_bots boolean default true,
  remove_unknown_bots boolean default true,
  exempt_admins boolean default true,
  spam_max_messages integer default 6,
  spam_window_seconds integer default 12,
  spam_action text default 'warn',
  spam_restrict_seconds integer default 300,
  forward_action text default 'warn',
  inline_keyboard_action text default 'warn',
  ban_after_warnings integer default 3,
  duplicate_message_enabled boolean default true,
  duplicate_message_max_count integer default 3,
  duplicate_message_window_seconds integer default 600,
  duplicate_message_action text default 'warn',
  duplicate_message_reason text,
  warning_text text,
  forward_warning_reason text,
  forward_warning_text text,
  spam_restrict_text text,
  warning_notice_delete_seconds integer default 180,
  forward_warning_delete_seconds integer default 180,
  spam_notice_delete_seconds integer default 30,
  welcome_enabled boolean default false,
  welcome_text text,
  welcome_buttons_text text,
  welcome_delete_seconds integer default 30,
  scan_bio_links boolean default true,
  bio_link_delete_message boolean default true,
  bio_link_restrict_seconds integer default 0,
  bio_scan_cache_seconds integer default 3600,
  bio_link_warning_text text,
  bio_link_notice_delete_seconds integer default 30,
  daily_enabled boolean default true,
  daily_window_start text default '20:00',
  daily_window_end text default '23:59',
  send_if_silent boolean default false,
  message_pool text default 'default',
  video_enabled boolean default false,
  video_window_start text default '21:00',
  video_window_end text default '23:00',
  video_pool text default 'default',
  show_policy_button boolean default false,
  policy_button_text text default 'Quy định',
  help_menu_commands text default 'start,policy,reload,checkbio,debuggroup,warn,ban,unban',
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

create table channel_posts (
  id bigserial primary key,
  bot_key text not null default 'main',
  target_chat_id text not null,
  title text,
  content text not null,
  buttons_text text,
  parse_mode text not null default 'HTML',
  disable_web_page_preview boolean not null default false,
  status text not null default 'draft',
  sent_message_id text,
  sent_at timestamptz,
  scheduled_at timestamptz,
  delete_at timestamptz,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  created_by text,
  deleted_by text,
  error_code text,
  error text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table channel_post_events (
  id bigserial primary key,
  bot_key text not null default 'main',
  channel_post_id bigint references channel_posts(id) on delete cascade,
  event_type text not null,
  message text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
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

create table giveaway_campaigns (
  id bigserial primary key,
  bot_key text not null default 'main',
  chat_id text not null,
  title text not null,
  prize text,
  description text,
  status text not null default 'open',
  winner_count integer not null default 1,
  require_keyword text,
  start_at timestamptz,
  end_at timestamptz,
  winners text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table giveaway_entries (
  id bigserial primary key,
  bot_key text not null default 'main',
  giveaway_id bigint not null,
  chat_id text not null,
  user_id text not null,
  username text,
  display_name text,
  entry_note text,
  created_at timestamptz not null default now(),
  unique (giveaway_id, user_id)
);

create table share_unlock_campaigns (
  id bigserial primary key,
  bot_key text not null default 'main',
  source_chat_id text not null,
  title text not null,
  description text,
  required_invites integer not null default 5,
  unlock_target_type text not null default 'invite_link',
  unlock_target_value text not null,
  share_message text,
  unlock_message text,
  status text not null default 'open',
  unlocked_at timestamptz,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table share_unlock_invites (
  id bigserial primary key,
  bot_key text not null default 'main',
  campaign_id bigint not null references share_unlock_campaigns(id) on delete cascade,
  referrer_user_id text not null,
  source_chat_id text not null,
  invite_link text not null,
  invite_name text,
  active boolean not null default true,
  unlocked_at timestamptz,
  reward_sent_at timestamptz,
  reward_message_id text,
  created_at timestamptz not null default now(),
  unique (campaign_id, referrer_user_id)
);

create table share_unlock_referrals (
  id bigserial primary key,
  bot_key text not null default 'main',
  campaign_id bigint not null references share_unlock_campaigns(id) on delete cascade,
  referrer_user_id text not null,
  invitee_user_id text not null,
  invitee_username text,
  invitee_chat_id text not null,
  invite_link text,
  counted boolean not null default true,
  created_at timestamptz not null default now(),
  unique (campaign_id, invitee_user_id)
);

create table entertainment_events (
  id bigserial primary key,
  bot_key text not null default 'main',
  event_key text not null,
  event_name text not null,
  event_type text not null default 'custom',
  chat_id text,
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  notes text,
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

create table analytics_daily_stats (
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

create table analytics_member_activity (
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
alter table channel_posts enable row level security;
alter table channel_post_events enable row level security;
alter table video_messages enable row level security;
alter table bot_allowlist enable row level security;
alter table scam_entities enable row level security;
alter table scam_reports enable row level security;
alter table reputation_rules enable row level security;
alter table reputation_events enable row level security;
alter table audit_logs enable row level security;
alter table bot_metrics enable row level security;
alter table analytics_daily_stats enable row level security;
alter table analytics_member_activity enable row level security;
alter table giveaway_campaigns enable row level security;
alter table giveaway_entries enable row level security;
alter table entertainment_events enable row level security;
alter table share_unlock_campaigns enable row level security;
alter table share_unlock_invites enable row level security;
alter table share_unlock_referrals enable row level security;

insert into bots (bot_key, name, username, enabled) values
  ('main', 'Bot chính', null, true);

insert into groups (bot_key, group_id, group_name, warning_text, policy_text, notes) values
  ('main', '-1002151486481', 'Hàng Cú chat', 'Cảnh báo: {reason} ({count}/{limit})', 'Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam hoặc quảng cáo.\n3. Không forward bài/video vào nhóm.\n4. Admin có quyền mute/kick/ban nếu vi phạm.', 'Sửa group_id trong CP nếu cần.');

insert into config (bot_key, key, value, enabled, notes) values
  ('main', 'policy_text', 'Quy định nhóm:\n1. Tôn trọng thành viên.\n2. Không spam hoặc quảng cáo.\n3. Không forward bài/video vào nhóm.', true, 'Nội quy mặc định.'),
  ('main', 'scam_review_channel_id', '', true, 'Channel/group nhận báo cáo scam đã duyệt hoặc báo cáo mới.'),
  ('main', 'scam_review_group_id', '', true, 'Group review nội bộ để admin duyệt report bằng lệnh.'),
  ('main', 'delete_system_messages', 'true', true, 'Xóa tin join/leave/pin/đổi title.'),
  ('main', 'delete_forwarded_messages', 'true', true, 'Chặn tin forward.'),
  ('main', 'allow_forward_messages', 'true', true, 'Cho phép forward có kiểm soát và quét nội dung forward.'),
  ('main', 'forward_allowed_sources', 'channel_private, channel_public, group_private, group_public, user', true, 'Các nguồn forward được phép.'),
  ('main', 'forward_allowed_content_types', 'text, photo, video, document, sticker', true, 'Các loại nội dung forward được phép.'),
  ('main', 'forward_spam_max_messages', '3', true, 'Số forward tối đa trong khung thời gian.'),
  ('main', 'forward_spam_window_seconds', '30', true, 'Khung thời gian đếm forward spam.'),
  ('main', 'forward_violation_restrict_after', '3', true, 'Restrict sau số lần vi phạm forward.'),
  ('main', 'forward_violation_ban_after', '4', true, 'Ban sau số lần vi phạm forward.'),
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
  ('main', 'duplicate_message_enabled', 'true', true, 'Chặn user gửi cùng tin nhắn/sticker nhiều lần.'),
  ('main', 'duplicate_message_max_count', '3', true, 'Số lần trùng được phép trong khung thời gian.'),
  ('main', 'duplicate_message_window_seconds', '600', true, 'Khung thời gian kiểm tra trùng, 600 giây là 10 phút.'),
  ('main', 'duplicate_message_action', 'warn', true, 'Hành động khi gửi nội dung/sticker trùng quá mức.'),
  ('main', 'duplicate_message_reason', 'Không gửi lặp lại cùng một nội dung hoặc sticker.', true, 'Lý do cảnh báo khi gửi trùng.'),
  ('main', 'captcha_text', '{mention} vui lòng xác minh trong {seconds}s: {question}', true, 'Tin captcha đơn giản.'),
  ('main', 'show_policy_button', 'false', true, 'Bật/tắt nút Quy định dưới tin /start và /help.'),
  ('main', 'policy_button_text', 'Quy định', true, 'Nội dung nút Quy định.'),
  ('main', 'bot_menu_commands', 'start,help,policy', true, 'Các lệnh hiện trong menu Telegram, cách nhau bằng dấu phẩy.'),
  ('main', 'help_menu_commands', 'start,policy,reload,checkbio,debuggroup,warn,ban,unban', true, 'Các lệnh hiện trong /help, cách nhau bằng dấu phẩy.'),
  ('main', 'help_menu_title', 'Menu chức năng:', true, 'Tiêu đề lệnh /help.'),
  ('main', 'start_fallback_text', 'Bot đang hoạt động. Hãy cấu hình tab Tin nhắn để thay đổi nội dung.', true, 'Tin fallback khi chưa có tin nhắn.'),
  ('main', 'admin_only_text', 'Lệnh này chỉ dành cho admin.', true, 'Thông báo khi user không có quyền admin.'),
  ('main', 'check_usage_text', 'Gửi: /check uid, username, số tài khoản hoặc số điện thoại cần tra cứu.', true, 'Hướng dẫn dùng /check.'),
  ('main', 'check_not_found_text', 'Chưa thấy dữ liệu scam cho: {query}', true, 'Kết quả khi không có dữ liệu scam.'),
  ('main', 'check_result_title', 'Kết quả tra cứu:', true, 'Tiêu đề kết quả /check.'),
  ('main', 'report_usage_text', 'Gửi: /report nội dung báo cáo, UID/username/số tài khoản và bằng chứng.', true, 'Hướng dẫn dùng /report.'),
  ('main', 'report_received_text', 'Đã ghi nhận báo cáo #{id}. Admin sẽ kiểm tra và xác nhận.', true, 'Tin xác nhận report.'),
  ('main', 'addscam_usage_text', 'Gửi: /addscam uid | username | số tài khoản | lý do', true, 'Hướng dẫn dùng /addscam.'),
  ('main', 'addscam_success_text', 'Đã thêm dữ liệu scam #{id}.', true, 'Tin xác nhận thêm scam.'),
  ('main', 'scam_review_channel_text', 'Báo cáo scam mới #{id}:\n{text}', true, 'Nội dung gửi channel/group review scam.'),
  ('main', 'giveaway_created_text', 'Đã tạo giveaway #{id}.\nTên: {title}\nPhần thưởng: {prize}\nTham gia bằng: /join {id}', true, 'Tin tạo giveaway.'),
  ('main', 'giveaway_empty_text', 'Hiện chưa có giveaway đang mở.', true, 'Không có giveaway.'),
  ('main', 'giveaway_list_title', 'Giveaway đang mở:', true, 'Tiêu đề danh sách giveaway.'),
  ('main', 'giveaway_join_usage_text', 'Gửi: /join <giveaway_id>', true, 'Hướng dẫn tham gia giveaway.'),
  ('main', 'giveaway_not_found_open_text', 'Không tìm thấy giveaway đang mở.', true, 'Không tìm thấy giveaway mở.'),
  ('main', 'giveaway_keyword_required_text', 'Giveaway này yêu cầu nhập từ khóa: /join {id} {keyword}', true, 'Yêu cầu từ khóa giveaway.'),
  ('main', 'giveaway_joined_text', 'Đã ghi nhận tham gia giveaway #{id}. Mã lượt: {entry_id}', true, 'Tham gia giveaway thành công.'),
  ('main', 'giveaway_join_duplicate_text', 'Bạn đã tham gia giveaway này rồi hoặc dữ liệu chưa hợp lệ.', true, 'Trùng lượt giveaway.'),
  ('main', 'giveaway_draw_usage_text', 'Gửi: /draw <giveaway_id>', true, 'Hướng dẫn quay số giveaway.'),
  ('main', 'giveaway_not_found_text', 'Không tìm thấy giveaway.', true, 'Không tìm thấy giveaway.'),
  ('main', 'giveaway_no_entries_text', 'Giveaway chưa có người tham gia.', true, 'Giveaway chưa có lượt.'),
  ('main', 'giveaway_result_text', 'Kết quả giveaway #{id}:\n{winners}', true, 'Kết quả quay số giveaway.'),
  ('main', 'giveaway_close_usage_text', 'Gửi: /closegiveaway <giveaway_id>', true, 'Hướng dẫn đóng giveaway.'),
  ('main', 'giveaway_closed_text', 'Đã đóng giveaway #{id}.', true, 'Đóng giveaway thành công.'),
  ('main', 'send_on_boot', 'false', true, 'Không gửi tin khi bot khởi động.'),
  ('main', 'send_if_silent', 'false', true, 'Chỉ gửi tin nếu nhóm có hoạt động.');

insert into module_settings (bot_key, module_key, module_name, category, enabled, settings, notes) values
  ('main', 'moderation', 'Kiểm duyệt cơ bản', 'Bảo mật', true, '{}'::jsonb, null),
  ('main', 'verification', 'Verify thành viên', 'Bảo mật', false, '{}'::jsonb, null),
  ('main', 'anti_scam', 'Tra cứu và báo cáo scam', 'Bảo mật', true, '{}'::jsonb, null),
  ('main', 'auto_reply', 'Auto reply', 'Tăng tương tác', true, '{}'::jsonb, null),
  ('main', 'reputation', 'Điểm tương tác', 'Tăng tương tác', true, '{}'::jsonb, null),
  ('main', 'entertainment', 'Giải trí', 'Tăng tương tác', true, '{"children":["giveaway","poll_event","checkin_streak","mini_quiz","lucky_number","leaderboard"]}'::jsonb, 'Module lớn cho hoạt động giải trí/tăng tương tác'),
  ('main', 'giveaway', 'Giveaway quay số may mắn', 'Giải trí', true, '{}'::jsonb, 'Tạo giveaway, member tham gia, admin quay số'),
  ('main', 'poll_event', 'Bình chọn / sự kiện', 'Giải trí', false, '{}'::jsonb, 'Gợi ý module con'),
  ('main', 'checkin_streak', 'Check-in chuỗi ngày', 'Giải trí', false, '{}'::jsonb, 'Gợi ý module con'),
  ('main', 'mini_quiz', 'Đố vui nhanh', 'Giải trí', false, '{}'::jsonb, 'Gợi ý module con'),
  ('main', 'lucky_number', 'Số may mắn', 'Giải trí', false, '{}'::jsonb, 'Gợi ý module con'),
  ('main', 'leaderboard', 'Bảng xếp hạng tương tác', 'Giải trí', false, '{}'::jsonb, 'Gợi ý module con'),
  ('main', 'analytics', 'Thống kê dashboard', 'Quản trị', true, '{}'::jsonb, null),
  ('main', 'scheduled_posts', 'Đăng bài định kỳ', 'Vận hành', true, '{}'::jsonb, null),
  ('main', 'channel_publisher', 'Đăng channel', 'Vận hành', true, '{}'::jsonb, 'Soạn bài có nút inline rồi gửi lên channel/group'),
  ('main', 'monetization', 'Kiếm tiền / vận hành', 'Vận hành', false, '{}'::jsonb, null);

insert into admins (bot_key, user_id, chat_id, role, enabled, notes) values
  ('main', '887869657', '-1002151486481', 'owner', true, 'Owner'),
  ('main', '7344961485', null, 'mod', true, 'Mod toàn hệ thống'),
  ('main', '5080922525', null, 'mod', true, 'Mod toàn hệ thống');

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

insert into giveaway_campaigns (bot_key, chat_id, title, prize, description, status, winner_count, require_keyword, enabled, notes) values
  ('main', '-1002151486481', 'Giveaway mẫu', 'Phần thưởng mẫu', 'Member bấm /join giveaway_id để tham gia.', 'open', 1, '', true, 'Sửa hoặc xóa dòng mẫu trong CP.');

insert into share_unlock_campaigns (bot_key, source_chat_id, title, description, required_invites, unlock_target_type, unlock_target_value, share_message, unlock_message, status, enabled, notes) values
  ('main', '-1002151486481', 'Mở khóa nhóm VIP', 'Mời đủ 5 người vào nhóm để mở khóa link tham gia nhóm VIP.', 5, 'invite_link', 'https://t.me/+replace_me_reward_link', 'Mời đủ {required} người qua link riêng của bạn để mở khóa.', 'Bạn đã đủ điều kiện. Đây là link mở khóa: {reward}', 'open', false, 'Dòng mẫu cho module share unlock.');

insert into entertainment_events (bot_key, event_key, event_name, event_type, config, enabled, notes) values
  ('main', 'weekly_poll', 'Bình chọn tuần', 'poll_event', '{"question":"Bạn muốn event gì tuần này?"}'::jsonb, false, 'Module con gợi ý'),
  ('main', 'daily_checkin', 'Check-in hằng ngày', 'checkin_streak', '{"points":2}'::jsonb, false, 'Module con gợi ý'),
  ('main', 'quick_quiz', 'Đố vui nhanh', 'mini_quiz', '{"points":5}'::jsonb, false, 'Module con gợi ý'),
  ('main', 'lucky_number', 'Số may mắn', 'lucky_number', '{"min":1,"max":99}'::jsonb, false, 'Module con gợi ý');
