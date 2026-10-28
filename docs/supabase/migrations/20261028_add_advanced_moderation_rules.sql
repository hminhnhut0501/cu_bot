-- Migration: Add advanced moderation rules & anti-raid defense keys
-- 2026-10-28: Anonymous channels, New member probation, Anti-raid panic mode, Zero-width bypass

insert into config (bot_key, key, value, enabled, notes) values
  ('main', 'block_anonymous_channels', 'true', true, 'Chặn tin nhắn gửi từ Kênh Telegram (Sender Chat) để ẩn danh.'),
  ('main', 'anonymous_channel_action', 'ban', true, 'Hành động khi phát hiện tin từ Sender Chat: ban hoặc delete.'),
  ('main', 'new_member_probation_seconds', '600', true, 'Thời gian thử thách tân thủ (giây), 600s = 10 phút. 0 là tắt.'),
  ('main', 'new_member_restrict_media', 'true', true, 'Tân thủ không được gửi media/link/sticker trong thời gian thử thách.'),
  ('main', 'anti_raid_enabled', 'true', true, 'Tự động kích hoạt phòng vệ khẩn cấp khi bị tấn công tham gia ồ ạt.'),
  ('main', 'anti_raid_threshold', '5', true, 'Số lượng thành viên mới tối đa trong khung thời gian trước khi kích hoạt Anti-Raid.'),
  ('main', 'anti_raid_window_seconds', '30', true, 'Cửa sổ thời gian (giây) theo dõi join burst.'),
  ('main', 'anti_raid_action', 'kick', true, 'Hành vi xử lý khi phát hiện raid: kick hoặc ban.'),
  ('main', 'block_zero_width_space', 'true', true, 'Chặn các ký tự tàng hình Zero-Width Space hoặc RTL nhằm lách luật.'),
  ('main', 'zero_width_threshold', '3', true, 'Ngưỡng số lượng ký tự tàng hình trong 1 tin nhắn để coi là vi phạm.')
on conflict do nothing;
