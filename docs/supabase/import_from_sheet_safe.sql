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

-- messages: 330 row(s)
insert into messages (message, pool, weight, enabled) values ($cu70$Câu nói dâm dục$cu70$, $cu71$default$cu71$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu72$Ông xã ơi cặc anh cứng chưa? Em thèm bú lắm$cu72$, $cu73$default$cu73$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu74$Anh yêu ơi em nứng đít quá, anh đụ em đi$cu74$, $cu75$default$cu75$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu76$Mấy anh chồng ơi ai cho em bú cu ngay bây giờ?$cu76$, $cu77$default$cu77$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu78$Ông xã em van anh, nhét cu vào đít em đi$cu78$, $cu79$default$cu79$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu80$Anh yêu ơi đít em ướt nhẹp rồi, anh vào đi$cu80$, $cu81$default$cu81$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu82$Chồng ơi cặc anh to quá, em thèm nuốt hết$cu82$, $cu83$default$cu83$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu84$Mấy anh ơi em cong mông chờ anh đụ đây$cu84$, $cu85$default$cu85$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu86$Ông xã ơi đổ tinh nóng vào trong em đi$cu86$, $cu87$default$cu87$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu88$Anh yêu em đang co thắt gọi cu anh nè$cu88$, $cu89$default$cu89$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu90$Chồng ơi anh đụ em mạnh tay đi em xin anh$cu90$, $cu91$default$cu91$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu92$Em là vợ dâm của anh, anh dùng em thả ga$cu92$, $cu93$default$cu93$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu94$Ông xã ơi liếm lỗ đít em rồi đụ em nha$cu94$, $cu95$default$cu95$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu96$Anh yêu ơi em thèm cu anh nhét sâu lắm$cu96$, $cu97$default$cu97$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu98$Mấy anh chồng ơi ai muốn đụ em từ sau?$cu98$, $cu99$default$cu99$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu100$Chồng ơi bắn tinh đầy đít em đi em van anh$cu100$, $cu101$default$cu101$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu102$Ông xã em nứng run cả người rồi, anh cứu em$cu102$, $cu103$default$cu103$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu104$Anh yêu ơi cặc anh giật giật em muốn bú$cu104$, $cu105$default$cu105$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu106$Em cong mông cao mời cu anh vào đây$cu106$, $cu107$default$cu107$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu108$Ông xã ơi em chỉ dành lỗ đít cho anh thôi$cu108$, $cu109$default$cu109$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu110$Chồng ơi anh đụ em đến khi em run người đi$cu110$, $cu111$default$cu111$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu112$Anh yêu ơi em thèm tinh anh nóng bỏng quá$cu112$, $cu113$default$cu113$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu114$Mấy anh ơi ai cho em bú cu sạch sẽ?$cu114$, $cu115$default$cu115$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu116$Ông xã em mặc hở đít chờ anh xem nè$cu116$, $cu117$default$cu117$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu118$Anh yêu ơi nhét cu to vào em đi em chịu được$cu118$, $cu119$default$cu119$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu120$Chồng ơi em sướng quá ư ư anh đừng dừng$cu120$, $cu121$default$cu121$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu122$Ông xã ơi em van anh đụ mạnh nữa đi$cu122$, $cu123$default$cu123$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu124$Anh yêu ơi đít em tròn căng mời anh đụ$cu124$, $cu125$default$cu125$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu126$Mấy anh chồng ơi em thèm bị anh đổ tinh đầy$cu126$, $cu127$default$cu127$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu128$Chồng ơi cặc anh dài em muốn ngậm hết$cu128$, $cu129$default$cu129$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu130$Ông xã em đang ướt lỗ chờ cu anh đây$cu130$, $cu131$default$cu131$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu132$Anh yêu ơi anh ôm em rồi đụ em mạnh đi$cu132$, $cu133$default$cu133$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu134$Em là vợ ngoan chỉ biết van anh đụ$cu134$, $cu135$default$cu135$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu136$Ông xã ơi liếm đít em đi em thích lắm$cu136$, $cu137$default$cu137$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu138$Chồng ơi anh bắn tinh trong em rồi đụ tiếp$cu138$, $cu139$default$cu139$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu140$Anh yêu ơi em nứng không ngủ nổi nữa$cu140$, $cu141$default$cu141$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu142$Mấy anh ơi ai muốn thay phiên đụ em?$cu142$, $cu143$default$cu143$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu144$Ông xã em cong mông lắc cho anh xem$cu144$, $cu145$default$cu145$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu146$Anh yêu ơi cu anh cứng ngắc em bú ngay$cu146$, $cu147$default$cu147$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu148$Chồng ơi em xin anh nhét sâu tận đáy$cu148$, $cu149$default$cu149$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu150$Ông xã ơi em thèm bị anh dùng mạnh bạo$cu150$, $cu151$default$cu151$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu152$Anh yêu ơi đổ tinh nóng vào ruột em đi$cu152$, $cu153$default$cu153$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu154$Mấy anh chồng ơi em sẵn sàng bị anh đụ$cu154$, $cu155$default$cu155$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu156$Chồng ơi anh dừng lại đi… aaaa mạnh nữa$cu156$, $cu157$default$cu157$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu158$Ông xã em bú cu anh đến khi anh xịt$cu158$, $cu159$default$cu159$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu160$Anh yêu ơi lỗ em co thắt gọi anh$cu160$, $cu161$default$cu161$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu162$Em van mấy anh đụ em thật sâu đi$cu162$, $cu163$default$cu163$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu164$Ông xã ơi em thèm cu anh trong người lắm$cu164$, $cu165$default$cu165$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu166$Chồng ơi anh đụ em doggy em lắc mông$cu166$, $cu167$default$cu167$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu168$Anh yêu ơi em là con đĩ của anh mà$cu168$, $cu169$default$cu169$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu170$Ông xã ơi bắn tinh đầy miệng em nha$cu170$, $cu171$default$cu171$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu172$Mấy anh ơi ai muốn đụ em liên tục?$cu172$, $cu173$default$cu173$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu174$Chồng ơi đít em mướt nước chờ anh$cu174$, $cu175$default$cu175$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu176$Anh yêu ơi anh nhét hai ngón trước đi$cu176$, $cu177$default$cu177$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu178$Ông xã em thèm bị anh ôm chặt đụ$cu178$, $cu179$default$cu179$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu180$Chồng ơi em sướng run chân vì anh$cu180$, $cu181$default$cu181$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu182$Anh yêu ơi cu anh to làm em mê luôn$cu182$, $cu183$default$cu183$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu184$Ông xã ơi em xin anh đừng rút ra$cu184$, $cu185$default$cu185$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu186$Mấy anh chồng ơi em chờ anh nhét cu vào$cu186$, $cu187$default$cu187$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu188$Chồng ơi anh liếm lỗ em rồi đụ mạnh$cu188$, $cu189$default$cu189$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu190$Anh yêu ơi em van anh bắn tinh nhiều lần$cu190$, $cu191$default$cu191$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu192$Ông xã em cong mông cao mời anh$cu192$, $cu193$default$cu193$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu194$Chồng ơi em chỉ là vợ dâm của anh$cu194$, $cu195$default$cu195$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu196$Anh yêu ơi anh đụ em đến khóc vì sướng$cu196$, $cu197$default$cu197$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu198$Ông xã ơi em thèm tinh anh nóng hổi$cu198$, $cu199$default$cu199$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu200$Mấy anh ơi ai cho em bú cu sáng nay?$cu200$, $cu201$default$cu201$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu202$Chồng ơi đít em ngứa lắm anh chữa đi$cu202$, $cu203$default$cu203$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu204$Anh yêu ơi em sẵn sàng quỳ bú anh$cu204$, $cu205$default$cu205$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu206$Ông xã ơi anh đụ em từ từ rồi mạnh$cu206$, $cu207$default$cu207$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu208$Em van anh đổ đầy tinh vào đít em$cu208$, $cu209$default$cu209$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu210$Chồng ơi cặc anh ngon em liếm sạch$cu210$, $cu211$default$cu211$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu212$Anh yêu ơi em nứng đít muốn nổ tung$cu212$, $cu213$default$cu213$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu214$Ông xã ơi anh ôm em rồi nhét cu vào$cu214$, $cu215$default$cu215$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu216$Mấy anh ơi em là vợ chung của anh$cu216$, $cu217$default$cu217$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu218$Chồng ơi em thèm bị anh tát mông khi đụ$cu218$, $cu219$default$cu219$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu220$Anh yêu ơi lỗ em giãn ra chờ anh$cu220$, $cu221$default$cu221$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu222$Ông xã em bú cu anh thật lâu nha$cu222$, $cu223$default$cu223$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu224$Chồng ơi anh bắn tinh rồi đổi tư thế$cu224$, $cu225$default$cu225$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu226$Anh yêu ơi em xin anh dùng em thả ga$cu226$, $cu227$default$cu227$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu228$Ông xã ơi em cong mông chờ anh từ sau$cu228$, $cu229$default$cu229$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu230$Mấy anh ơi ai muốn nhét cu to vào em?$cu230$, $cu231$default$cu231$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu232$Chồng ơi em sướng quá anh đụ mạnh nữa$cu232$, $cu233$default$cu233$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu234$Anh yêu ơi tinh anh nóng em thích lắm$cu234$, $cu235$default$cu235$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu236$Ông xã em van anh đừng dừng lại$cu236$, $cu237$default$cu237$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu238$Chồng ơi em là vợ dâm ngoan của anh$cu238$, $cu239$default$cu239$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu240$Anh yêu ơi cu anh cứng em muốn ngậm$cu240$, $cu241$default$cu241$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu242$Ông xã ơi em ướt nhẹp hết cả đít$cu242$, $cu243$default$cu243$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu244$Mấy anh ơi em thèm bị anh đụ mạnh$cu244$, $cu245$default$cu245$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu246$Chồng ơi anh liếm đít em đi em mê$cu246$, $cu247$default$cu247$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu248$Anh yêu ơi em xin anh bắn tinh đầy$cu248$, $cu249$default$cu249$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu250$Ông xã ơi đít em tròn căng chờ anh$cu250$, $cu251$default$cu251$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu252$Chồng ơi em van anh nhét sâu hơn nữa$cu252$, $cu253$default$cu253$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu254$Anh yêu ơi em nứng vì anh cả ngày$cu254$, $cu255$default$cu255$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu256$Ông xã em sẵn sàng bị anh dùng$cu256$, $cu257$default$cu257$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu258$Mấy anh chồng ơi ai đụ em trước đây?$cu258$, $cu259$default$cu259$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu260$Chồng ơi em thèm cu anh trong đít lắm$cu260$, $cu261$default$cu261$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu262$Anh yêu ơi anh đụ em em rên tên anh$cu262$, $cu263$default$cu263$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu264$Ông xã ơi em là đồ chơi của anh$cu264$, $cu265$default$cu265$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu266$Chồng ơi anh bắn tinh nóng vào em đi$cu266$, $cu267$default$cu267$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu268$Anh yêu ơi em cong mông mời anh nhét$cu268$, $cu269$default$cu269$, 1, true);
insert into messages (message, pool, weight, enabled) values ($cu270$Ông xã em van anh đụ em không ngừng$cu270$, $cu271$default$cu271$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu272$Ông xã ơi cặc anh cứng ngắc chưa? Em thèm bú cu lắm 🍆😩$cu272$, $cu273$default$cu273$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu274$Anh yêu ơi đít em ướt nhẹp rồi, anh nhét cu vào mau đi 💦🍑$cu274$, $cu275$default$cu275$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu276$Chồng ơi em nứng đít quá, anh đụ em mạnh tay đi 😭🔥$cu276$, $cu277$default$cu277$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu278$Mấy anh chồng ơi ai cho em bú cu ngay bây giờ? 🍆💦$cu278$, $cu279$default$cu279$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu280$Ông xã ơi đổ tinh nóng hổi đầy đít em đi 💦😈$cu280$, $cu281$default$cu281$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu282$Anh yêu ơi cặc anh to quá, em muốn nuốt hết vào họng 🍆😛$cu282$, $cu283$default$cu283$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu284$Chồng ơi em cong mông cao, anh đụ em từ sau đi 🍑🔥$cu284$, $cu285$default$cu285$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu286$Ông xã ơi liếm lỗ đít em đi rồi nhét cu vào 😛🍑$cu286$, $cu287$default$cu287$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu288$Anh yêu ơi em van anh đụ mạnh nữa, em sướng quá ư ư 😩💦$cu288$, $cu289$default$cu289$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu290$Mấy anh ơi em là vợ dâm, ai muốn bắn tinh đầy em? 💦🍑$cu290$, $cu291$default$cu291$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu292$Chồng ơi đít em co thắt gọi cặc anh, anh vào đi 😭🍆$cu292$, $cu293$default$cu293$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu294$Ông xã ơi em thèm cu anh nhét sâu tận ruột 💦🔥$cu294$, $cu295$default$cu295$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu296$Anh yêu ơi bắn tinh đầy miệng em, em nuốt sạch nha 😛💦$cu296$, $cu297$default$cu297$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu298$Chồng ơi anh đụ em đến khi em run cả chân đi 😩🍑$cu298$, $cu299$default$cu299$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu300$Ông xã ơi em mặc hở đít chờ anh nhét cu 🍑😈$cu300$, $cu301$default$cu301$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu302$Anh yêu ơi cặc anh giật giật, em muốn bú sạch 🍆💦$cu302$, $cu303$default$cu303$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu304$Mấy anh chồng ơi ai muốn đụ em liên tục không nghỉ? 🔥😭$cu304$, $cu305$default$cu305$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu306$Ông xã ơi em xin anh nhét cu to giãn lỗ em ra 🍆🍑$cu306$, $cu307$default$cu307$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu308$Chồng ơi em nứng vl, anh đụ em mạnh bạo đi 😈💦$cu308$, $cu309$default$cu309$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu310$Anh yêu ơi đổ tinh nóng vào trong đít em đầy luôn 💦😩$cu310$, $cu311$default$cu311$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu312$Ông xã ơi em cong mông lắc lư mời anh đụ 🍑🔥$cu312$, $cu313$default$cu313$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu314$Chồng ơi anh liếm đít em thật sâu đi em mê 😛🍑$cu314$, $cu315$default$cu315$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu316$Anh yêu ơi em thèm bị anh dùng như con đĩ 😈💕$cu316$, $cu317$default$cu317$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu318$Ông xã ơi cặc anh cứng em bú ngay bây giờ 🍆😛$cu318$, $cu319$default$cu319$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu320$Mấy anh ơi em van anh bắn tinh nhiều lần vào em 💦🍑$cu320$, $cu321$default$cu321$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu322$Chồng ơi đít em tròn căng mướt, anh sờ và đụ đi 🍑💦$cu322$, $cu323$default$cu323$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu324$Anh yêu ơi em sướng quá aaaa anh đừng dừng lại 😭🔥$cu324$, $cu325$default$cu325$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu326$Ông xã ơi em chỉ là lỗ đít dành cho anh đụ thôi 🍑😩$cu326$, $cu327$default$cu327$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu328$Chồng ơi anh nhét cu sâu nữa đi, em chịu được hết 💦😈$cu328$, $cu329$default$cu329$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu330$Anh yêu ơi em thèm tinh anh nóng bỏng bắn đầy ruột 💦🍆$cu330$, $cu331$default$cu331$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu332$Ông xã ơi em quỳ sẵn chờ anh đụ mạnh 🍑🔥$cu332$, $cu333$default$cu333$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu334$Mấy anh chồng ơi ai muốn thay phiên đụ em? 😈💦$cu334$, $cu335$default$cu335$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu336$Chồng ơi em bú cu anh đến khi anh xịt tinh đầy miệng 😛💦$cu336$, $cu337$default$cu337$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu338$Anh yêu ơi lỗ em co thắt thèm cặc anh quá 😩🍆$cu338$, $cu339$default$cu339$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu340$Ông xã ơi anh đụ em doggy em lắc mông cho anh 🍑😘$cu340$, $cu341$default$cu341$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu342$Chồng ơi em nứng không ngủ nổi, anh cứu em bằng cu đi 🍆💦$cu342$, $cu343$default$cu343$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu344$Anh yêu ơi bắn tinh lên mặt em đi, em há miệng chờ 😛💦$cu344$, $cu345$default$cu345$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu346$Ông xã ơi em thèm bị anh tát mông khi đụ 😈🍑$cu346$, $cu347$default$cu347$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu348$Mấy anh ơi em là vợ dâm chung, ai muốn đụ em? 🔥💦$cu348$, $cu349$default$cu349$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu350$Chồng ơi anh ôm em chặt rồi nhét cu vào mạnh đi 😩💕$cu350$, $cu351$default$cu351$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu352$Anh yêu ơi em xin anh creampie em liên tục 💦🍑$cu352$, $cu353$default$cu353$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu354$Ông xã ơi đít em ngứa lắm, anh chữa bằng cu to đi 🍆😭$cu354$, $cu355$default$cu355$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu356$Chồng ơi em van anh đụ em không ngừng nghỉ 🔥💦$cu356$, $cu357$default$cu357$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu358$Anh yêu ơi cặc anh khấc to làm em mê mẩn 🍆😩$cu358$, $cu359$default$cu359$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu360$Ông xã ơi em cong mông cao mời anh nhét hết 🍑💦$cu360$, $cu361$default$cu361$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu362$Mấy anh chồng ơi ai cho em bú hai cu cùng lúc? 🍆🍆$cu362$, $cu363$default$cu363$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu364$Chồng ơi em sướng run người vì cu anh rồi 😭🔥$cu364$, $cu365$default$cu365$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu366$Anh yêu ơi anh dừng lại đi… aaaa mạnh tay nữa đi 😩💦$cu366$, $cu367$default$cu367$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu368$Ông xã ơi em thèm cu anh chạm tận đáy lỗ em 🍆🍑$cu368$, $cu369$default$cu369$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu370$Chồng ơi em bú sạch cu anh rồi anh đụ em nha 😛💦$cu370$, $cu371$default$cu371$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu372$Anh yêu ơi em là con đĩ bottom của anh mà 😈💕$cu372$, $cu373$default$cu373$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu374$Ông xã ơi đổ tinh nóng vào đít em rồi đụ tiếp 💦🔥$cu374$, $cu375$default$cu375$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu376$Mấy anh ơi em mặc quần lót hở, ai muốn xem lỗ em? 🍑😈$cu376$, $cu377$default$cu377$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu378$Chồng ơi anh liếm đít em đi em ướt hết rồi 😛💦$cu378$, $cu379$default$cu379$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu380$Anh yêu ơi em van anh dùng em thô bạo đi 😩🔥$cu380$, $cu381$default$cu381$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu382$Ông xã ơi cặc anh cứng ngắc em muốn ngậm hết 🍆😛$cu382$, $cu383$default$cu383$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu384$Chồng ơi em thèm bị anh bắn tinh đầy người 💦🍑$cu384$, $cu385$default$cu385$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu386$Anh yêu ơi lỗ em giãn rộng chờ cu anh nhét vào 🍑💦$cu386$, $cu387$default$cu387$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu388$Ông xã ơi em nứng đít muốn nổ tung rồi anh ơi 😭🍆$cu388$, $cu389$default$cu389$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu390$Mấy anh ơi ai muốn đụ em standing position? 🔥💦$cu390$, $cu391$default$cu391$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu392$Chồng ơi anh đụ em mạnh em rên tên anh nha 😩😈$cu392$, $cu393$default$cu393$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu394$Anh yêu ơi em xin anh bắn tinh nóng hổi vào trong 💦$cu394$, $cu395$default$cu395$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu396$Ông xã ơi em cong mông chờ anh từ đằng sau 🍑💕$cu396$, $cu397$default$cu397$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu398$Chồng ơi em thèm tinh anh tràn ra khỏi đít 😭💦$cu398$, $cu399$default$cu399$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu400$Anh yêu ơi cu anh ngon quá em liếm mãi không chán 🍆😛$cu400$, $cu401$default$cu401$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu402$Ông xã ơi em sẵn sàng bị anh đụ bất cứ lúc nào 🔥$cu402$, $cu403$default$cu403$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu404$Mấy anh chồng ơi em van anh nhét cu to vào mạnh 💦🍑$cu404$, $cu405$default$cu405$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu406$Chồng ơi anh ôm em rồi đụ em thật sâu đi 😩💕$cu406$, $cu407$default$cu407$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu408$Anh yêu ơi em là vợ dâm chỉ biết xin anh đụ 🍆😈$cu408$, $cu409$default$cu409$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu410$Ông xã ơi em ướt nhẹp hết cả đít chờ anh 🍑💦$cu410$, $cu411$default$cu411$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu412$Chồng ơi anh bắn tinh đầy ruột em đi em xin anh 💦😭$cu412$, $cu413$default$cu413$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu414$Anh yêu ơi em thèm bị anh dùng như đồ chơi tình dục 😈$cu414$, $cu415$default$cu415$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu416$Ông xã ơi cặc anh to em sợ mà thèm lắm 🍆💦$cu416$, $cu417$default$cu417$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu418$Mấy anh ơi ai muốn creampie đít em hôm nay? 💦🍑$cu418$, $cu419$default$cu419$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu420$Chồng ơi em bú cu anh thật lâu anh sướng không? 😛🔥$cu420$, $cu421$default$cu421$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu422$Anh yêu ơi anh đụ em đến khi em khóc vì sướng 😩💦$cu422$, $cu423$default$cu423$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu424$Ông xã ơi em cong mông lắc mời anh nhét cu 🍑😘$cu424$, $cu425$default$cu425$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu426$Chồng ơi em van anh đừng rút cu ra ngoài 💦😭$cu426$, $cu427$default$cu427$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu428$Anh yêu ơi em nứng vì cu anh cả ngày rồi 🍆🔥$cu428$, $cu429$default$cu429$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu430$Ông xã ơi liếm lỗ đít em rồi đụ mạnh tay đi 😛🍑$cu430$, $cu431$default$cu431$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu432$Mấy anh chồng ơi em thèm bị mấy anh đụ cùng lúc 😈💦$cu432$, $cu433$default$cu433$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu434$Chồng ơi em sướng quá ư ư anh đụ mạnh nữa đi 😩🔥$cu434$, $cu435$default$cu435$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu436$Anh yêu ơi em xin anh tinh đầy miệng và đầy đít 💦😛$cu436$, $cu437$default$cu437$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu438$Ông xã ơi đít em tròn căng mướt mời anh dùng 🍑💕$cu438$, $cu439$default$cu439$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu440$Chồng ơi anh nhét cu vào em rồi bắn tinh luôn đi 🍆💦$cu440$, $cu441$default$cu441$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu442$Anh yêu ơi em là vợ dâm ngoan của anh mà 😘😈$cu442$, $cu443$default$cu443$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu444$Ông xã ơi em thèm cu anh giật trong đít em 🍆😩$cu444$, $cu445$default$cu445$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu446$Mấy anh ơi ai muốn đụ em rồi bắn tinh đầy? 💦🍑$cu446$, $cu447$default$cu447$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu448$Chồng ơi em van anh dùng em thả ga đêm nay 🔥😭$cu448$, $cu449$default$cu449$, 1, false);
insert into messages (message, pool, weight, enabled) values ($cu450$Anh yêu ơi hành hạ em đi, đụ em thật mạnh bạo 😭💦$cu450$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu451$Ông xã ơi dùng em như con đĩ, hành hạ em thô bạo đi 🍑😈$cu451$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu452$Chồng ơi hành hạ đít em đi, đụ mạnh đến xé luôn 🔥😩$cu452$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu453$Mấy anh ơi hành hạ em mạnh tay, em xin mấy anh 💦🍆$cu453$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu454$Anh yêu ơi tát mông em đỏ lên rồi đụ em 😈🍑$cu454$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu455$Ông xã ơi hành hạ em bằng cu to, nhét mạnh vào đi 😭🔥$cu455$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu456$Chồng ơi em muốn bị anh hành hạ đến khóc luôn 💦😩$cu456$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu457$Anh yêu ơi bóp cổ em nhẹ rồi đụ mạnh em đi 😈💦$cu457$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu458$Ông xã ơi hành hạ vợ dâm của anh đi, dùng em thả ga 🍑🔥$cu458$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu459$Mấy anh chồng ơi hành hạ em chung, đụ em không thương tiếc 😭$cu459$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu460$Chồng ơi kéo tóc em rồi đụ từ sau mạnh bạo đi 🍆💦$cu460$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu461$Anh yêu ơi hành hạ lỗ đít em, đụ đến sưng luôn 😩🍑$cu461$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu462$Ông xã ơi em xin anh hành hạ em thật đau sướng 🔥😈$cu462$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu463$Chồng ơi tát em vài cái rồi nhét cu to vào 💦😭$cu463$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu464$Anh yêu ơi hành hạ em như con thú, đụ không ngừng 🍑😈$cu464$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu465$Ông xã ơi bắn tinh xong đừng rút, tiếp tục hành hạ em 💦🔥$cu465$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu466$Mấy anh ơi hành hạ em bằng cách thay phiên đụ mạnh 😩🍆$cu466$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu467$Chồng ơi em muốn bị anh hành hạ đến run rẩy luôn 😭💦$cu467$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu468$Anh yêu ơi cắn vai em rồi đụ thật sâu mạnh tay 🍑😈$cu468$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu469$Ông xã ơi hành hạ đít em bằng cu khấc to đi 🔥💦$cu469$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu470$Chồng ơi em là đồ chơi của anh, hành hạ em thô bạo 😩😈$cu470$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu471$Anh yêu ơi nhét mạnh cu vào, hành hạ em đến mệt mỏi 💦🍑$cu471$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu472$Ông xã ơi hành hạ em bằng cách đụ liên tục không nghỉ 😭🔥$cu472$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu473$Mấy anh ơi dùng em mạnh bạo, hành hạ vợ dâm đi 🍆💦$cu473$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu474$Chồng ơi tát nhẹ cặc em rồi đụ mạnh lỗ đít 😈😩$cu474$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu475$Anh yêu ơi hành hạ em đi, em muốn đau vì sướng 🍑💦$cu475$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu476$Ông xã ơi kéo tay em ra sau rồi đụ như chó 🔥😭$cu476$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu477$Chồng ơi hành hạ em thật mạnh, em van anh 😩💦$cu477$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu478$Anh yêu ơi bắn tinh vào mặt em rồi tiếp tục hành hạ 😛😈$cu478$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu479$Ông xã ơi em xin anh hành hạ đít em đến sưng đỏ 🍑🔥$cu479$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu480$Mấy anh chồng ơi hành hạ em chung một lúc đi 💦🍆$cu480$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu481$Chồng ơi em thích bị anh hành hạ như con đĩ rẻ tiền 😈😭$cu481$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu482$Anh yêu ơi đụ em mạnh đến khi em khóc vì khoái lạc 💦🍑$cu482$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu483$Ông xã ơi hành hạ em bằng cu to và tay mạnh 🔥😩$cu483$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu484$Chồng ơi em muốn anh hành hạ em suốt đêm nay 😭💦$cu484$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu485$Anh yêu ơi bóp mông em mạnh rồi nhét sâu cu vào 🍑😈$cu485$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu486$Ông xã ơi hành hạ vợ anh đi, đụ em thô bạo không thương 🍆💦$cu486$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu487$Mấy anh ơi hành hạ em bằng cách đổ tinh đầy rồi đụ tiếp 😩🔥$cu487$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu488$Chồng ơi em van anh hành hạ em thật lực đi 😭💦$cu488$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu489$Anh yêu ơi dùng em như lỗ đít công cộng, hành hạ em 😈🍑$cu489$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu490$Ông xã ơi đụ em mạnh đến khi em không đứng nổi 🔥😩$cu490$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu491$Chồng ơi hành hạ em bằng roi nhẹ hoặc tay tát mông 💦😈$cu491$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu492$Anh yêu ơi em thèm bị anh hành hạ dã man 🍑😭$cu492$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu493$Ông xã ơi nhét cu thật mạnh, hành hạ lỗ em đi 💦🔥$cu493$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu494$Mấy anh chồng ơi hành hạ em cùng lúc, em chịu hết 😩🍆$cu494$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu495$Chồng ơi em là đồ chơi tình dục, anh hành hạ em đi 😈💦$cu495$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu496$Anh yêu ơi hành hạ em đến sướng phát điên luôn 🍑😭$cu496$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu497$Ông xã ơi đụ em mạnh bạo, em muốn bị anh làm nhục 💦😈$cu497$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu498$Chồng ơi hành hạ em ngay bây giờ đi, em nứng lắm rồi 🔥😩$cu498$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu499$Anh yêu ơi đít em to tròn căng mọng, anh đụ em đi 🍑💦$cu499$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu500$Ông xã ơi mông em căng tròn to lớn, anh nhét cu vào mau 😩🍑$cu500$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu501$Chồng ơi đào em to căng mướt, anh sờ và đụ mạnh đi 🔥🍑$cu501$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu502$Mấy anh ơi đít em tròn lẳn căng bóng, ai muốn đụ trước? 💦😈$cu502$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu503$Anh yêu ơi mông em to căng mời anh tát rồi đụ 🍑😭$cu503$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu504$Ông xã ơi đít em căng mọng như trái đào chín, anh đụ em 😩💦$cu504$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu505$Chồng ơi đào em to tròn mướt mát, anh nhét cu sâu đi 🍑🔥$cu505$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu506$Em van anh, đít em căng tròn to này chỉ chờ anh đụ 💦🍑$cu506$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu507$Anh yêu ơi mông em to căng rung rung, anh đụ từ sau đi 😈$cu507$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu508$Ông xã ơi đào em căng mọng ướt nhẹp, anh chữa cho em 🍑😩$cu508$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu509$Chồng ơi đít em tròn to căng bóng, anh muốn liếm không? 😛💦$cu509$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu510$Mấy anh chồng ơi mông em to căng mướt, ai nhét cu vào? 🔥🍑$cu510$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu511$Anh yêu ơi em cong đít to tròn lên cho anh ngắm 🍑😘$cu511$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu512$Ông xã ơi đào em căng tròn to lớn, anh đụ mạnh tay đi 😭💦$cu512$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu513$Chồng ơi mông em to căng mọng, anh tát đỏ rồi đụ 🍑😈$cu513$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu514$Anh yêu ơi đít em tròn lẳn căng mướt, anh nhét hết cu vào 💦$cu514$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu515$Ông xã ơi đào em to căng chờ anh, anh đụ em thô bạo đi 🔥😩$cu515$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu516$Em xin anh, mông em căng tròn to này anh dùng đi 🍑💦$cu516$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu517$Chồng ơi đít em to tròn mọng nước, anh liếm rồi đụ 😛🍑$cu517$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu518$Anh yêu ơi mông em căng bóng mời anh nhét cu mạnh 😈💦$cu518$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu519$Ông xã ơi đào em to căng rung lắc, anh đụ em doggy đi 🍑🔥$cu519$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu520$Chồng ơi đít em tròn to căng mọng, anh bắn tinh vào đi 💦😭$cu520$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu521$Mấy anh ơi mông em to căng mướt, ai muốn đụ chung? 😈🍑$cu521$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu522$Anh yêu ơi em cong mông to tròn cho anh xem lỗ 🍑😩$cu522$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu523$Ông xã ơi đào em căng tròn to lớn, anh đụ sâu tận đáy 💦$cu523$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu524$Chồng ơi đít em mọng nước căng bóng, anh hành hạ em đi 😈🍑$cu524$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu525$Anh yêu ơi mông em to tròn căng, anh ôm chặt rồi đụ 🔥💦$cu525$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu526$Ông xã ơi đào em căng mọng thèm cu anh, anh vào đi 😩🍆$cu526$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu527$Chồng ơi đít em tròn lẳn to căng, anh tát mạnh đi 🍑😭$cu527$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu528$Anh yêu ơi em lắc mông to căng mướt cho anh ngắm 😘💦$cu528$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu529$Ông xã ơi mông em căng tròn mời anh nhét cu to 🍑🔥$cu529$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu530$Mấy anh chồng ơi đít em to mọng, ai muốn đụ trước? 😈$cu530$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu531$Chồng ơi đào em căng bóng ướt át, anh đụ em mạnh bạo 💦🍑$cu531$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu532$Anh yêu ơi mông em tròn to căng mọng, anh dùng em đi 😩$cu532$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu533$Ông xã ơi đít em to căng rung khi anh đụ, anh thích không? 🍑💦$cu533$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu534$Chồng ơi em cong đào to tròn chờ anh nhét cu 🔥😭$cu534$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu535$Anh yêu ơi mông em căng mướt to lớn, anh liếm đít em 😛🍑$cu535$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu536$Ông xã ơi đào em tròn căng mọng nước, anh đụ em không ngừng 💦$cu536$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu537$Chồng ơi đít em to căng bóng, anh bắn tinh đầy vào đi 😈🍑$cu537$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu538$Anh yêu ơi em lắc mông to tròn cho anh nứng 🍑😘$cu538$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu539$Ông xã ơi mông em căng tròn to, anh hành hạ em mạnh đi 🔥😩$cu539$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu540$Mấy anh ơi đít em mọng căng mời anh nhét cu to 💦🍑$cu540$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu541$Chồng ơi đào em to tròn căng mướt, anh đụ em doggy 😈$cu541$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu542$Anh yêu ơi mông em căng bóng thèm bị anh tát 🍑💦$cu542$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu543$Ông xã ơi em cong đít to căng lên cho anh đụ 🍑😭$cu543$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu544$Chồng ơi đít em tròn lẳn mọng nước, anh nhét mạnh vào 🔥$cu544$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu545$Anh yêu ơi mông em to căng rung lắc, anh ôm em đụ 💦😩$cu545$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu546$Ông xã ơi đào em căng mọng chờ tinh anh đổ vào 🍑💦$cu546$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu547$Chồng ơi em van anh, dùng mông to căng của em đi 😈$cu547$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu548$Anh yêu ơi đít em to tròn căng, anh đụ em thật thô bạo 🔥🍑$cu548$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu549$Ông xã ơi mông em mướt mát căng mọng, anh liếm rồi đụ 😛💦$cu549$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu550$Chồng ơi đào em to căng mời anh nhét cu khấc to 🍆🍑$cu550$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu551$Anh yêu ơi em lắc đít to tròn cho anh xem 🍑😘$cu551$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu552$Ông xã ơi mông em căng bóng to lớn, anh dùng em thả ga 😈💦$cu552$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu553$Chồng ơi đít em tròn căng mọng, anh tát mạnh rồi đụ 🍑🔥$cu553$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu554$Anh yêu ơi đào em căng mướt ướt nhẹp chờ anh 😩💦$cu554$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu555$Ông xã ơi em cong mông to căng cao cho anh đụ 🍑😭$cu555$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu556$Mấy anh ơi đít em to mọng căng, ai muốn hành hạ em? 😈$cu556$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu557$Chồng ơi mông em tròn lẳn căng bóng, anh bắn tinh lên 🍑💦$cu557$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu558$Anh yêu ơi em thèm anh nhét cu vào đít to căng của em 🔥$cu558$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu559$Ông xã ơi đào em căng mọng to lớn, anh đụ em không thương tiếc 😩$cu559$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu560$Chồng ơi mông em to căng rung khi bị đụ mạnh 💦🍑$cu560$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu561$Anh yêu ơi đít em tròn căng mướt, anh liếm sạch đi 😛$cu561$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu562$Ông xã ơi em lắc mông to tròn mời anh nhét cu 🍑😈$cu562$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu563$Chồng ơi đào em căng bóng thèm cu anh lắm 😭💦$cu563$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu564$Anh yêu ơi mông em to căng mọng, anh ôm chặt hành hạ em 🔥$cu564$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu565$Ông xã ơi đít em tròn to căng, anh đụ em đến sưng 🍑😩$cu565$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu566$Chồng ơi em cong đào to mướt cho anh xem lỗ 💦🍑$cu566$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu567$Anh yêu ơi mông em căng tròn mời anh tát và đụ 😈$cu567$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu568$Ông xã ơi đít em to căng mọng nước, anh đổ tinh vào đi 💦$cu568$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu569$Chồng ơi em van anh dùng mông to tròn căng của em 🍑🔥$cu569$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu570$Anh yêu ơi đào em căng mướt to lớn chờ anh nhét 🍆😩$cu570$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu571$Ông xã ơi mông em tròn lẳn căng bóng, anh thích không? 😘💦$cu571$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu572$Chồng ơi em lắc đít to căng cho anh nứng mạnh 🍑😈$cu572$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu573$Anh yêu ơi đít em mọng căng thèm bị anh đụ mạnh 💦😭$cu573$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu574$Ông xã ơi đào em to tròn căng, anh hành hạ em đi 🔥🍑$cu574$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu575$Chồng ơi mông em căng mướt mời anh nhét cu sâu 🍑💦$cu575$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu576$Anh yêu ơi em cong mông to căng cao chờ anh 😩😈$cu576$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu577$Ông xã ơi đít em tròn to mọng, anh bắn tinh đầy ruột 💦$cu577$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu578$Chồng ơi đào em căng bóng ướt át, anh đụ em thô bạo 🍑🔥$cu578$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu579$Anh yêu ơi mông em to căng rung lắc, anh ôm em đi 😘$cu579$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu580$Ông xã ơi em thèm anh tát mông to căng của em 😈💦$cu580$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu581$Chồng ơi đít em tròn căng mọng nước mời anh 🍑😩$cu581$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu582$Anh yêu ơi mông em to lẳn căng, anh dùng em mạnh tay 🔥$cu582$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu583$Ông xã ơi đào em căng mướt to, anh nhét cu vào ngay 💦🍑$cu583$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu584$Chồng ơi em lắc đít to tròn cho anh xem 🍑😛$cu584$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu585$Anh yêu ơi mông em căng bóng thèm tinh anh đổ vào 😭💦$cu585$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu586$Ông xã ơi đít em to căng mọng, anh hành hạ em thả ga 😈🍑$cu586$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu587$Chồng ơi đào em tròn lẳn căng mời anh đụ mạnh 🔥$cu587$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu588$Anh yêu ơi em cong mông to căng chờ cu anh nhét 🍑💦$cu588$, null, null, null);
insert into messages (message, pool, weight, enabled) values ($cu589$Ông xã ơi mông em căng mướt to lớn, anh liếm rồi đụ 😛😩$cu589$, null, null, null);

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
