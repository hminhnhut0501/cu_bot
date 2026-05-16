-- CU BOT - SAFE SUPABASE IMPORT FROM YOUR SHEET
-- Source workbook: /Users/hminhnhut/Downloads/cu_bot_google_sheet_template.xlsx
-- Run the whole file in Supabase SQL Editor.
-- This file resets only the bot tables below.

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

-- groups: 2 row(s)
insert into groups (group_id, group_name, enabled, delete_system_messages, delete_forwarded_messages, delete_inline_keyboard_messages, delete_messages_from_bots, remove_unknown_bots, exempt_admins, spam_max_messages, spam_window_seconds, spam_action, forward_action, inline_keyboard_action, ban_after_warnings, warning_text, daily_enabled, daily_window_start, daily_window_end, send_if_silent, message_pool, video_enabled, video_window_start, video_window_end, video_pool, policy_text, notes) values ($cu1$-1002151486481$cu1$, $cu2$Hang Cú chat$cu2$, true, true, true, true, true, true, true, 3, 12, $cu3$warn$cu3$, $cu4$warn$cu4$, $cu5$warn$cu5$, 3, $cu6$⚠️ Cảnh báo: {reason} ({count}/{limit})$cu6$, true, $cu7$20:00$cu7$, $cu8$23:59$cu8$, false, $cu9$default$cu9$, true, $cu10$21:00$cu10$, $cu11$23:00$cu11$, $cu12$default$cu12$, $cu13$📌 <b>NỘI QUY GROUP CHAT</b>

• Tôn trọng mọi thành viên trong group  
• Không spam, flood hoặc gửi link rác  
• Không leak, reup hay chia sẻ nội dung ra bên ngoài  
• Không quảng cáo, kéo member hoặc bán hàng khi chưa được phép  
• Hạn chế gây war, toxic hoặc làm ảnh hưởng trải nghiệm chung  
• Admin có quyền mute/kick/ban vĩnh viễn nếu vi phạm

💎 Giữ group văn minh để mọi người có trải nghiệm tốt nhất.$cu13$, $cu14$Doi group_id thanh group that$cu14$);
insert into groups (group_id, group_name, enabled, delete_system_messages, delete_forwarded_messages, delete_inline_keyboard_messages, delete_messages_from_bots, remove_unknown_bots, exempt_admins, spam_max_messages, spam_window_seconds, spam_action, forward_action, inline_keyboard_action, ban_after_warnings, warning_text, daily_enabled, daily_window_start, daily_window_end, send_if_silent, message_pool, video_enabled, video_window_start, video_window_end, video_pool, policy_text, notes) values ($cu15$-1002151486481$cu15$, $cu16$Group phu$cu16$, false, true, true, true, true, true, true, 8, 15, $cu17$delete$cu17$, $cu18$delete$cu18$, $cu19$warn$cu19$, 3, $cu20$⚠️ Cảnh báo: {reason} ({count}/{limit})$cu20$, true, $cu21$19:00$cu21$, $cu22$22:00$cu22$, true, $cu23$sales$cu23$, false, $cu24$21:00$cu24$, $cu25$23:00$cu25$, $cu26$default$cu26$, null, $cu27$Dong mau, co the xoa$cu27$);

-- config: 21 row(s)
insert into config (key, value, enabled) values ($cu28$policy_text$cu28$, $cu29$📌 <b>NỘI QUY GROUP CHAT</b>

• Tôn trọng mọi thành viên trong group  
• Không spam, flood hoặc gửi link rác  
• Không leak, reup hay chia sẻ nội dung ra bên ngoài  
• Không quảng cáo, kéo member hoặc bán hàng khi chưa được phép  
• Hạn chế gây war, toxic hoặc làm ảnh hưởng trải nghiệm chung  
• Admin có quyền mute/kick/ban vĩnh viễn nếu vi phạm

💎 Giữ group văn minh để mọi người có trải nghiệm tốt nhất.$cu29$, true);
insert into config (key, value, enabled) values ($cu30$delete_system_messages$cu30$, $cu31$true$cu31$, true);
insert into config (key, value, enabled) values ($cu32$delete_forwarded_messages$cu32$, $cu33$true$cu33$, true);
insert into config (key, value, enabled) values ($cu34$delete_inline_keyboard_messages$cu34$, $cu35$true$cu35$, true);
insert into config (key, value, enabled) values ($cu36$delete_messages_from_bots$cu36$, $cu37$true$cu37$, true);
insert into config (key, value, enabled) values ($cu38$remove_unknown_bots$cu38$, $cu39$true$cu39$, true);
insert into config (key, value, enabled) values ($cu40$scan_bio_links$cu40$, $cu41$true$cu41$, true);
insert into config (key, value, enabled) values ($cu42$bio_scan_cache_seconds$cu42$, $cu43$3600$cu43$, true);
insert into config (key, value, enabled) values ($cu44$bio_link_restrict_seconds$cu44$, $cu45$0$cu45$, true);
insert into config (key, value, enabled) values ($cu46$bio_link_warning_text$cu46$, $cu47${mention} ơi, vui lòng gỡ link trên bio rồi liên hệ admin để mở chat trở lại nhen!$cu47$, true);
insert into config (key, value, enabled) values ($cu48$exempt_admins$cu48$, $cu49$true$cu49$, true);
insert into config (key, value, enabled) values ($cu50$spam_max_messages$cu50$, $cu51$3$cu51$, true);
insert into config (key, value, enabled) values ($cu52$spam_window_seconds$cu52$, $cu53$12$cu53$, true);
insert into config (key, value, enabled) values ($cu54$spam_action$cu54$, $cu55$warn$cu55$, true);
insert into config (key, value, enabled) values ($cu56$forward_action$cu56$, $cu57$warn$cu57$, true);
insert into config (key, value, enabled) values ($cu58$inline_keyboard_action$cu58$, $cu59$warn$cu59$, true);
insert into config (key, value, enabled) values ($cu60$ban_after_warnings$cu60$, $cu61$3$cu61$, true);
insert into config (key, value, enabled) values ($cu62$daily_window_start$cu62$, $cu63$20:00$cu63$, true);
insert into config (key, value, enabled) values ($cu64$daily_window_end$cu64$, $cu65$23:59$cu65$, true);
insert into config (key, value, enabled) values ($cu66$send_if_silent$cu66$, $cu67$false$cu67$, true);
insert into config (key, value, enabled) values ($cu68$send_on_boot$cu68$, $cu69$false$cu69$, true);

-- messages: 1 row(s)
insert into messages (message, pool, weight, enabled) values ($msg$Bot đang hoạt động. Admin có thể sửa nội dung này trong control panel.$msg$, $pool$default$pool$, 1, true);

-- keywords: 37 row(s)
insert into keywords (keyword, match, action, reason, enabled) values ($cu590$casino$cu590$, $cu591$contains$cu591$, $cu592$warn$cu592$, $cu593$Từ khóa cấm$cu593$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu594$telegram.me/$cu594$, $cu595$contains$cu595$, $cu596$delete$cu596$, $cu597$Link spam$cu597$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu598$t.me/spam$cu598$, $cu599$contains$cu599$, $cu600$ban$cu600$, $cu601$Link spam$cu601$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu602$free money$cu602$, $cu603$contains$cu603$, $cu604$warn$cu604$, $cu605$Nội dung spam$cu605$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu606$telegram\.me/$cu606$, $cu607$regex$cu607$, $cu608$delete$cu608$, $cu609$Từ khóa cấm$cu609$, false);
insert into keywords (keyword, match, action, reason, enabled) values ($cu610$kid$cu610$, $cu611$contains$cu611$, $cu612$delete$cu612$, $cu613$Từ khóa nhạy cảm$cu613$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu614$kids$cu614$, $cu615$contains$cu615$, $cu616$delete$cu616$, $cu617$Từ khóa nhạy cảm$cu617$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu618$trẻ em$cu618$, $cu619$contains$cu619$, $cu620$delete$cu620$, $cu621$Từ khóa nhạy cảm$cu621$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu622$học sinh$cu622$, $cu623$contains$cu623$, $cu624$delete$cu624$, $cu625$Từ khóa nhạy cảm$cu625$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu626$đụ$cu626$, $cu627$contains$cu627$, $cu628$delete$cu628$, $cu629$Từ khóa nhạy cảm$cu629$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu630$k.i.d$cu630$, $cu631$contains$cu631$, $cu632$delete$cu632$, $cu633$Từ khóa nhạy cảm$cu633$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu634$crypto$cu634$, $cu635$contains$cu635$, $cu636$delete$cu636$, $cu637$Từ khóa cấm$cu637$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu638$miễn phí$cu638$, $cu639$contains$cu639$, $cu640$delete$cu640$, $cu641$Từ khóa cấm$cu641$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu642$free$cu642$, $cu643$contains$cu643$, $cu644$delete$cu644$, $cu645$Từ khóa cấm$cu645$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu646$kiếm tiền$cu646$, $cu647$contains$cu647$, $cu648$delete$cu648$, $cu649$Từ khóa cấm$cu649$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu650$làm giàu$cu650$, $cu651$contains$cu651$, $cu652$delete$cu652$, $cu653$Từ khóa cấm$cu653$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu654$đầu tư$cu654$, $cu655$contains$cu655$, $cu656$delete$cu656$, $cu657$Từ khóa cấm$cu657$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu658$coin$cu658$, $cu659$contains$cu659$, $cu660$delete$cu660$, $cu661$Từ khóa cấm$cu661$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu662$forex$cu662$, $cu663$contains$cu663$, $cu664$delete$cu664$, $cu665$Từ khóa cấm$cu665$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu666$bet$cu666$, $cu667$contains$cu667$, $cu668$delete$cu668$, $cu669$Từ khóa cấm$cu669$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu670$cá cược$cu670$, $cu671$contains$cu671$, $cu672$delete$cu672$, $cu673$Từ khóa cấm$cu673$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu674$tài xỉu$cu674$, $cu675$contains$cu675$, $cu676$delete$cu676$, $cu677$Từ khóa cấm$cu677$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu678$ref$cu678$, $cu679$contains$cu679$, $cu680$delete$cu680$, $cu681$Từ khóa cấm$cu681$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu682$airdrop$cu682$, $cu683$contains$cu683$, $cu684$delete$cu684$, $cu685$Từ khóa cấm$cu685$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu686$wa.me$cu686$, $cu687$contains$cu687$, $cu688$delete$cu688$, $cu689$Từ khóa cấm$cu689$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu690$t.me/$cu690$, $cu691$contains$cu691$, $cu692$delete$cu692$, $cu693$Từ khóa cấm$cu693$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu694$book kèo$cu694$, $cu695$contains$cu695$, $cu696$delete$cu696$, $cu697$Từ khóa cấm$cu697$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu698$shopee$cu698$, $cu699$contains$cu699$, $cu700$delete$cu700$, $cu701$Từ khóa cấm$cu701$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu702$zalo$cu702$, $cu703$contains$cu703$, $cu704$delete$cu704$, $cu705$Từ khóa cấm$cu705$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu706$.xxx$cu706$, $cu707$contains$cu707$, $cu708$delete$cu708$, $cu709$Từ khóa cấm$cu709$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu710$.apk$cu710$, $cu711$contains$cu711$, $cu712$delete$cu712$, $cu713$Từ khóa cấm$cu713$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu714$hack$cu714$, $cu715$contains$cu715$, $cu716$delete$cu716$, $cu717$Từ khóa cấm$cu717$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu718$crack$cu718$, $cu719$contains$cu719$, $cu720$delete$cu720$, $cu721$Từ khóa cấm$cu721$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu722$mod$cu722$, $cu723$contains$cu723$, $cu724$delete$cu724$, $cu725$Từ khóa cấm$cu725$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu726$sex$cu726$, $cu727$contains$cu727$, $cu728$delete$cu728$, $cu729$Từ khóa cấm$cu729$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu730$camsex$cu730$, $cu731$contains$cu731$, $cu732$delete$cu732$, $cu733$Từ khóa cấm$cu733$, true);
insert into keywords (keyword, match, action, reason, enabled) values ($cu734$escort$cu734$, $cu735$contains$cu735$, $cu736$delete$cu736$, $cu737$Từ khóa cấm$cu737$, true);

-- admins: 3 row(s)
insert into admins (user_id, chat_id, enabled, notes) values ($cu738$887869657$cu738$, $cu739$-1001234567890$cu739$, true, $cu740$Nhựt$cu740$);
insert into admins (user_id, chat_id, enabled, notes) values ($cu741$7344961485$cu741$, null, true, $cu742$thám tử$cu742$);
insert into admins (user_id, chat_id, enabled, notes) values ($cu743$5080922525$cu743$, null, true, $cu744$helio$cu744$);

-- bot_allowlist: 1 row(s)
insert into bot_allowlist (bot_id, username, chat_id, enabled) values ($cu745$123456789$cu745$, $cu746$helpful_bot$cu746$, $cu747$-1001234567890$cu747$, true);

-- video_messages: 2 row(s)
insert into video_messages (from_chat_id, message_id, caption, pool, weight, enabled) values ($cu748$-1009876543210$cu748$, $cu749$456$cu749$, $cu750$Video hom nay$cu750$, $cu751$default$cu751$, 1, false);
insert into video_messages (from_chat_id, message_id, caption, pool, weight, enabled) values ($cu752$-1009876543210$cu752$, $cu753$789$cu753$, null, $cu754$default$cu754$, 2, false);

-- Verify row counts after import:
select 'groups' as table_name, count(*) as row_count from groups;
select 'config' as table_name, count(*) as row_count from config;
select 'messages' as table_name, count(*) as row_count from messages;
select 'keywords' as table_name, count(*) as row_count from keywords;
select 'admins' as table_name, count(*) as row_count from admins;
select 'bot_allowlist' as table_name, count(*) as row_count from bot_allowlist;
select 'video_messages' as table_name, count(*) as row_count from video_messages;
