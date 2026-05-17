"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  BarChart3,
  Bot,
  Check,
  CheckSquare,
  Database,
  Edit3,
  Gift,
  Loader2,
  Plus,
  Power,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  MessageSquare,
  TrendingUp,
  Users,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

import { FieldConfig, TableConfig } from "@/lib/tables";

type Row = Record<string, any>;
type BulkRow = Record<string, string | number | boolean | null>;
type BulkDefaults = {
  bot_key: string;
  pool: string;
  weight: number;
  action: string;
  match: string;
  reason: string;
  risk: string;
  risk_level: string;
  status: string;
  source: string;
  enabled: boolean;
};

type Meta = {
  tables: TableConfig[];
  passwordRequired: boolean;
};
type Lookups = {
  bots: Row[];
  groups: Row[];
  messages: Row[];
  videos: Row[];
  moduleSettings: Row[];
};

const defaultBoolean = new Set(["enabled", "daily_enabled", "delete_system_messages", "delete_forwarded_messages"]);
const bulkTables = new Set(["messages", "keywords", "video_messages", "scam_entities", "domain_blacklist", "link_shorteners", "auto_replies"]);
const NAV_GROUPS = [
  { label: "Tổng quan", keys: ["bot_metrics", "audit_logs"] },
  { label: "Bot & nhóm", keys: ["bots", "groups", "module_settings", "config", "admins", "member_roles"] },
  { label: "Bảo mật", keys: ["verification_settings", "captcha_questions", "keywords", "domain_blacklist", "link_shorteners", "bot_allowlist"] },
  { label: "Nội dung", keys: ["messages", "video_messages", "auto_replies", "scheduled_posts"] },
  { label: "Scam", keys: ["scam_entities", "scam_reports"] },
  { label: "Giải trí", keys: ["entertainment_events", "giveaway_campaigns", "giveaway_entries", "reputation_rules"] }
];
const SYSTEM_LAYERS = [
  {
    key: "overview",
    title: "Tổng quan",
    shortTitle: "Tổng quan",
    desc: "Xem nhanh bot nào đang chạy, module nào cần xử lý và hành động tiếp theo.",
    icon: BarChart3,
    tone: "main",
    tables: ["bot_metrics", "audit_logs", "bots", "groups", "module_settings"]
  },
  {
    key: "bot",
    title: "Bot",
    shortTitle: "Bot",
    desc: "Token, trạng thái, quyền chạy, profile và kết nối của từng bot.",
    icon: Bot,
    tone: "content",
    tables: ["bots", "admins", "module_settings"]
  },
  {
    key: "group",
    title: "Nhóm",
    shortTitle: "Nhóm",
    desc: "Bot được phép hoạt động ở group/kênh nào, quyền admin, member và bot được phép.",
    icon: Users,
    tone: "security",
    tables: ["groups", "bot_allowlist", "admins", "member_roles"]
  },
  {
    key: "modules",
    title: "Chức năng",
    shortTitle: "Chức năng",
    desc: "Bật/tắt và vận hành các service lớn như kiểm duyệt, auto reply, scam, giải trí.",
    icon: Sparkles,
    tone: "content",
    tables: ["module_settings", "messages", "video_messages", "auto_replies", "scam_entities", "giveaway_campaigns", "entertainment_events", "reputation_rules"]
  },
  {
    key: "automation",
    title: "Tự động hóa",
    shortTitle: "Tự động hóa",
    desc: "Lịch đăng, gửi tin tự động, video, nhóm nội dung và điều kiện theo giờ/group.",
    icon: SlidersHorizontal,
    tone: "fun",
    tables: ["scheduled_posts", "messages", "video_messages", "groups", "config"]
  },
  {
    key: "security",
    title: "Bảo mật",
    shortTitle: "Bảo mật",
    desc: "Từ khóa cấm, link xấu, domain blacklist, captcha, verify và action xử lý.",
    icon: SlidersHorizontal,
    tone: "fun",
    tables: ["keywords", "domain_blacklist", "link_shorteners", "verification_settings", "captcha_questions", "bot_allowlist", "groups"]
  },
  {
    key: "members",
    title: "Thành viên",
    shortTitle: "Thành viên",
    desc: "Phân quyền admin, role member, VIP, restricted và điểm tương tác.",
    icon: Users,
    tone: "security",
    tables: ["admins", "member_roles", "reputation_rules", "giveaway_entries"]
  },
  {
    key: "analytics",
    title: "Thống kê",
    shortTitle: "Thống kê",
    desc: "Chỉ số vận hành, tăng trưởng, spam, verify, scam report và hiệu quả module.",
    icon: BarChart3,
    tone: "scam",
    tables: ["bot_metrics", "scam_reports", "audit_logs"]
  },
  {
    key: "logs",
    title: "Nhật ký",
    shortTitle: "Nhật ký",
    desc: "Ai ban member, ai xóa tin, ai sửa quyền và các sự kiện vận hành cần rà soát.",
    icon: Activity,
    tone: "main",
    tables: ["audit_logs", "scam_reports"]
  },
  {
    key: "settings",
    title: "Cài đặt",
    shortTitle: "Cài đặt",
    desc: "Text, menu lệnh, nội quy, cảnh báo và cấu hình nâng cao chỉ mở khi cần.",
    icon: SlidersHorizontal,
    tone: "content",
    tables: ["config"]
  }
];
const TABLE_GUIDES: Record<string, { title: string; body: string; steps: string[] }> = {
  groups: {
    title: "Luồng cần nhớ",
    body: "Group là nơi nối cấu hình với bot: bật kiểm duyệt, chọn pool tin nhắn, đặt lịch gửi, nội quy và menu.",
    steps: ["Set đúng Group ID", "Chọn Nhóm nội dung trùng với Tin nhắn", "Bật/tắt nút Quy định và lệnh /help tại Menu bot"]
  },
  messages: {
    title: "Cách dùng Tin nhắn",
    body: "Tin trong cùng một Nhóm nội dung sẽ được bot chọn ngẫu nhiên theo Độ ưu tiên.",
    steps: ["Paste mỗi dòng một tin", "Đặt Nhóm nội dung mặc định khi nhập nhanh", "Vào Nhóm và set message_pool trùng tên"]
  },
  keywords: {
    title: "Rule kiểm duyệt",
    body: "Mỗi từ khóa có kiểu khớp và hành động riêng. Bot luôn xóa tin vi phạm trước rồi mới warn/mute/kick/ban nếu cần.",
    steps: ["contains cho từ khóa thường", "regex cho mẫu nâng cao", "action = warn nếu muốn cộng cảnh báo trước khi ban"]
  },
  bot_metrics: {
    title: "Dashboard",
    body: "Màn hình này gom các chỉ số vận hành để nhìn nhanh tình trạng bot/group.",
    steps: ["Sửa chỉ số thủ công ở danh sách bên dưới", "Dùng period today/week/month/all_time", "Các module sau sẽ tự ghi thêm metric"]
  },
  config: {
    title: "Cài đặt chung",
    body: "Các text, menu, thời gian xóa tin, cảnh báo và fallback nên đặt ở đây thay vì sửa code.",
    steps: ["key là mã cấu hình", "value là nội dung", "Tắt enabled nếu muốn bỏ qua"]
  }
};
const COMMAND_OPTIONS = ["start", "help", "policy", "reload", "checkbio", "debuggroup", "warn", "ban", "unban", "giveaway", "giveaways", "join", "draw", "check", "report"];
const CONFIG_LABELS: Record<string, string> = {
  policy_text: "Nội quy nhóm",
  scam_review_channel_id: "Channel duyệt báo cáo scam",
  delete_system_messages: "Xóa tin hệ thống",
  delete_forwarded_messages: "Chặn tin forward",
  delete_inline_keyboard_messages: "Chặn bài có nút bấm",
  delete_messages_from_bots: "Chặn bot lạ gửi tin",
  remove_unknown_bots: "Tự kick bot lạ",
  exempt_admins: "Bỏ qua admin",
  scan_bio_links: "Quét link trong bio",
  bio_link_delete_message: "Xóa tin khi bio có link",
  bio_link_warning_text: "Cảnh báo bio có link",
  captcha_text: "Tin nhắn captcha",
  show_policy_button: "Hiện nút Quy định",
  policy_button_text: "Tên nút Quy định",
  bot_menu_commands: "Menu lệnh Telegram",
  help_menu_commands: "Menu trong /help",
  help_menu_title: "Tiêu đề menu /help",
  start_fallback_text: "Tin /start khi chưa có nội dung",
  spam_action: "Cách xử lý spam",
  spam_restrict_seconds: "Thời gian mute khi spam",
  ban_seconds: "Thời gian ban",
  warning_notice_delete_seconds: "Tự xóa tin cảnh báo",
  forward_warning_delete_seconds: "Tự xóa cảnh báo forward",
  spam_notice_delete_seconds: "Tự xóa thông báo spam",
  violation_delete_retry_seconds: "Thử xóa lại tin vi phạm",
  duplicate_message_enabled: "Chặn tin/sticker lặp lại",
  duplicate_message_max_count: "Số lần lặp tối đa",
  duplicate_message_window_seconds: "Thời gian kiểm tra lặp",
  duplicate_message_action: "Xử lý khi bị lặp",
  duplicate_message_reason: "Lý do cảnh báo lặp",
  send_on_boot: "Gửi tin khi bot khởi động",
  send_if_silent: "Chỉ gửi khi nhóm im lặng",
  admin_only_text: "Tin báo chỉ admin dùng được",
  check_usage_text: "Hướng dẫn lệnh /check",
  check_not_found_text: "Tin khi không thấy dữ liệu scam",
  check_result_title: "Tiêu đề kết quả /check",
  report_usage_text: "Hướng dẫn lệnh /report",
  report_received_text: "Tin xác nhận nhận report",
  addscam_usage_text: "Hướng dẫn lệnh /addscam",
  addscam_success_text: "Tin thêm scam thành công",
  scam_review_channel_text: "Mẫu tin gửi channel duyệt scam",
  giveaway_created_text: "Tin tạo giveaway",
  giveaway_empty_text: "Tin khi không có giveaway",
  giveaway_list_title: "Tiêu đề danh sách giveaway",
  giveaway_join_usage_text: "Hướng dẫn tham gia giveaway",
  giveaway_not_found_open_text: "Tin không thấy giveaway đang mở",
  giveaway_keyword_required_text: "Tin yêu cầu từ khóa giveaway",
  giveaway_joined_text: "Tin tham gia giveaway thành công",
  giveaway_join_duplicate_text: "Tin báo đã tham gia giveaway",
  giveaway_draw_usage_text: "Hướng dẫn quay giveaway",
  giveaway_not_found_text: "Tin không tìm thấy giveaway",
  giveaway_no_entries_text: "Tin giveaway chưa có người tham gia",
  giveaway_result_text: "Mẫu kết quả giveaway",
  giveaway_close_usage_text: "Hướng dẫn đóng giveaway",
  giveaway_closed_text: "Tin đóng giveaway thành công"
};
const CONFIG_SECTIONS = [
  {
    title: "Nội quy & menu",
    desc: "Nội dung bot gửi khi /start, nút Quy định và menu lệnh trong group.",
    icon: MessageSquare,
    tone: "content",
    keys: ["policy_text", "show_policy_button", "policy_button_text", "bot_menu_commands", "help_menu_commands", "start_fallback_text", "help_menu_title"]
  },
  {
    title: "Kiểm duyệt tự động",
    desc: "Các công tắc chặn nội dung thường gặp trong group.",
    icon: ShieldCheck,
    tone: "security",
    keys: ["delete_system_messages", "delete_forwarded_messages", "delete_inline_keyboard_messages", "delete_messages_from_bots", "remove_unknown_bots", "exempt_admins"]
  },
  {
    title: "Spam, cảnh báo & ban",
    desc: "Quy định bot sẽ warn, mute, kick hoặc ban thế nào khi phát hiện spam/vi phạm.",
    icon: SlidersHorizontal,
    tone: "security",
    keys: ["spam_action", "spam_restrict_seconds", "ban_seconds", "warning_notice_delete_seconds", "forward_warning_delete_seconds", "spam_notice_delete_seconds", "violation_delete_retry_seconds", "duplicate_message_enabled", "duplicate_message_max_count", "duplicate_message_window_seconds", "duplicate_message_action", "duplicate_message_reason"]
  },
  {
    title: "Bio, link & cảnh báo",
    desc: "Quét link trong bio, xóa tin vi phạm và nội dung cảnh báo.",
    icon: Archive,
    tone: "scam",
    keys: ["scan_bio_links", "bio_link_delete_message", "bio_link_restrict_seconds", "bio_scan_cache_seconds", "bio_link_warning_text", "bio_link_notice_delete_seconds"]
  },
  {
    title: "Captcha & verify",
    desc: "Tin nhắn xác minh thành viên mới và thời gian tự xóa.",
    icon: Bot,
    tone: "main",
    keys: ["captcha_text", "captcha_success_text", "captcha_failed_text", "captcha_message_delete_seconds", "verify_success_delete_seconds"]
  },
  {
    title: "Scam & báo cáo",
    desc: "Channel duyệt báo cáo và nội dung phản hồi khi tra cứu scam.",
    icon: Activity,
    tone: "fun",
    keys: ["scam_review_channel_id", "admin_only_text", "check_usage_text", "check_not_found_text", "check_result_title", "report_usage_text", "report_received_text", "addscam_usage_text", "addscam_success_text", "scam_review_channel_text", "scam_report_pending_text", "scam_report_confirmed_text", "scam_check_safe_text", "scam_check_found_text"]
  },
  {
    title: "Gửi tin tự động",
    desc: "Cách bot gửi nội dung khi khởi động hoặc khi nhóm im lặng.",
    icon: Sparkles,
    tone: "content",
    keys: ["send_on_boot", "send_if_silent"]
  },
  {
    title: "Giveaway",
    desc: "Toàn bộ mẫu tin cho module quay số may mắn và quản lý lượt tham gia.",
    icon: Gift,
    tone: "fun",
    keys: ["giveaway_created_text", "giveaway_empty_text", "giveaway_list_title", "giveaway_join_usage_text", "giveaway_not_found_open_text", "giveaway_keyword_required_text", "giveaway_joined_text", "giveaway_join_duplicate_text", "giveaway_draw_usage_text", "giveaway_not_found_text", "giveaway_no_entries_text", "giveaway_result_text", "giveaway_close_usage_text", "giveaway_closed_text"]
  }
];
const MODULE_HUBS = [
  {
    key: "moderation",
    moduleKeys: ["moderation"],
    title: "Kiểm duyệt",
    desc: "Spam, tin forward, nút bấm, bot lạ, từ khóa cấm và link xấu.",
    icon: ShieldCheck,
    tone: "security",
    tables: ["groups", "keywords", "domain_blacklist", "link_shorteners", "bot_allowlist", "config"]
  },
  {
    key: "verification",
    moduleKeys: ["verification"],
    title: "Verify",
    desc: "Captcha, chào thành viên mới, tự kick member chưa xác minh.",
    icon: Bot,
    tone: "main",
    tables: ["verification_settings", "captcha_questions", "config"]
  },
  {
    key: "content",
    moduleKeys: ["scheduled_posts"],
    title: "Nội dung",
    desc: "Tin nhắn, video, lịch đăng và nhóm nội dung dùng chung.",
    icon: Sparkles,
    tone: "content",
    tables: ["messages", "video_messages", "scheduled_posts", "groups", "config"]
  },
  {
    key: "auto_reply",
    moduleKeys: ["auto_reply"],
    title: "Auto reply",
    desc: "Câu kích hoạt, nội dung trả lời tự động và kiểu khớp.",
    icon: MessageSquare,
    tone: "fun",
    tables: ["auto_replies", "config"]
  },
  {
    key: "anti_scam",
    moduleKeys: ["anti_scam"],
    title: "Chống scam",
    desc: "Dữ liệu scam, báo cáo riêng, channel duyệt và tra cứu /check.",
    icon: Archive,
    tone: "scam",
    tables: ["scam_entities", "scam_reports", "config"]
  },
  {
    key: "entertainment",
    moduleKeys: ["entertainment", "giveaway"],
    title: "Giải trí",
    desc: "Giveaway, quay số, event, điểm tương tác và bảng xếp hạng.",
    icon: Gift,
    tone: "fun",
    tables: ["giveaway_campaigns", "giveaway_entries", "entertainment_events", "reputation_rules", "config"]
  },
  {
    key: "analytics",
    moduleKeys: ["analytics"],
    title: "Thống kê",
    desc: "Dashboard, nhật ký hoạt động và sức khỏe vận hành.",
    icon: BarChart3,
    tone: "main",
    tables: ["bot_metrics", "audit_logs"]
  }
];
const CONFIG_DESCRIPTIONS: Record<string, string> = {
  policy_text: "Nội quy gửi kèm khi thành viên bấm nút Quy định hoặc gọi lệnh liên quan.",
  show_policy_button: "Bật/tắt nút Quy định xuất hiện dưới tin nhắn /start.",
  policy_button_text: "Tên hiển thị của nút Quy định trong Telegram.",
  bot_menu_commands: "Các lệnh chính bot đăng ký cho menu Telegram.",
  help_menu_commands: "Các lệnh hiển thị trong nội dung /help.",
  help_menu_title: "Dòng tiêu đề nằm phía trên danh sách lệnh khi user gọi /help.",
  start_fallback_text: "Tin nhắn dự phòng khi /start không có nội dung riêng.",
  delete_system_messages: "Tự xóa tin join/leave/pin và các tin hệ thống.",
  delete_forwarded_messages: "Chặn tin nhắn forward từ nơi khác.",
  delete_inline_keyboard_messages: "Chặn bài có nút bấm inline đáng ngờ.",
  delete_messages_from_bots: "Xóa tin do bot lạ gửi vào group.",
  remove_unknown_bots: "Tự kick bot không nằm trong danh sách cho phép.",
  exempt_admins: "Bỏ qua admin khi kiểm duyệt spam/keyword/link.",
  spam_action: "Hành động mặc định khi user spam: warn để cảnh báo, mute để khóa chat tạm, ban để chặn khỏi nhóm.",
  spam_restrict_seconds: "Số giây mute/restrict user khi spam. Ví dụ 300 là 5 phút.",
  ban_seconds: "Số giây ban user. Đặt 0 nghĩa là ban vĩnh viễn.",
  warning_notice_delete_seconds: "Sau bao lâu bot tự xóa tin cảnh báo chung để group đỡ rác.",
  forward_warning_delete_seconds: "Sau bao lâu bot tự xóa cảnh báo khi user gửi tin forward.",
  spam_notice_delete_seconds: "Sau bao lâu bot tự xóa thông báo spam.",
  violation_delete_retry_seconds: "Nếu xóa tin vi phạm lần đầu lỗi, bot chờ số giây này rồi thử xóa lại.",
  duplicate_message_enabled: "Bật để bot phát hiện user gửi cùng một tin nhắn hoặc cùng một sticker nhiều lần.",
  duplicate_message_max_count: "Số lần trùng nội dung/sticker được phép trong khung thời gian trước khi xử lý.",
  duplicate_message_window_seconds: "Khung thời gian tính lặp. Ví dụ 600 giây là 10 phút.",
  duplicate_message_action: "Hành động khi user lặp nội dung quá mức. Nên dùng warn để cảnh báo và tự xóa tin vi phạm.",
  duplicate_message_reason: "Nội dung lý do bot dùng trong tin cảnh báo khi user gửi trùng.",
  scan_bio_links: "Quét bio của người gửi để phát hiện link spam.",
  bio_link_delete_message: "Xóa tin nhắn của user nếu bio có link xấu.",
  bio_link_restrict_seconds: "Thời gian mute/restrict khi phát hiện bio có link.",
  bio_scan_cache_seconds: "Thời gian cache kết quả quét bio để giảm gọi API.",
  bio_link_warning_text: "Nội dung cảnh báo khi bio chứa link không an toàn.",
  bio_link_notice_delete_seconds: "Sau bao lâu tự xóa tin cảnh báo bio.",
  captcha_text: "Tin nhắn bot gửi khi thành viên mới cần xác minh.",
  captcha_success_text: "Tin nhắn sau khi xác minh thành công.",
  captcha_failed_text: "Tin nhắn khi xác minh thất bại hoặc hết hạn.",
  captcha_message_delete_seconds: "Sau bao lâu tự xóa tin captcha.",
  verify_success_delete_seconds: "Sau bao lâu tự xóa tin xác minh thành công.",
  scam_review_channel_id: "Channel/group nơi admin nhận báo cáo scam chờ duyệt.",
  admin_only_text: "Bot gửi câu này khi người không phải admin dùng lệnh quản trị.",
  check_usage_text: "Hướng dẫn user tra cứu scam bằng UID, username, số tài khoản hoặc số điện thoại.",
  check_not_found_text: "Tin trả về khi /check không tìm thấy dữ liệu scam.",
  check_result_title: "Tiêu đề đầu kết quả khi /check tìm thấy dữ liệu.",
  report_usage_text: "Hướng dẫn user gửi báo cáo scam qua /report.",
  report_received_text: "Tin xác nhận bot đã nhận report và lưu vào database.",
  addscam_usage_text: "Hướng dẫn admin thêm dữ liệu scam bằng /addscam.",
  addscam_success_text: "Tin xác nhận đã thêm một đối tượng scam vào database.",
  scam_review_channel_text: "Mẫu nội dung bot gửi sang channel duyệt scam để admin kiểm tra.",
  scam_report_pending_text: "Tin nhắn báo đã nhận report và chờ duyệt.",
  scam_report_confirmed_text: "Tin nhắn khi report đã được xác nhận.",
  scam_check_safe_text: "Kết quả trả về khi không tìm thấy dữ liệu scam.",
  scam_check_found_text: "Kết quả trả về khi tìm thấy đối tượng scam.",
  send_on_boot: "Bật nếu muốn bot gửi tin ngay khi service Render khởi động lại.",
  send_if_silent: "Bật nếu chỉ muốn bot gửi tin khi group có hoạt động hoặc im lặng theo logic lịch gửi.",
  giveaway_created_text: "Tin bot trả về sau khi admin tạo giveaway mới.",
  giveaway_empty_text: "Tin bot gửi khi user xem danh sách nhưng chưa có giveaway đang mở.",
  giveaway_list_title: "Tiêu đề trước danh sách giveaway đang mở.",
  giveaway_join_usage_text: "Hướng dẫn cú pháp /join để member tham gia giveaway.",
  giveaway_not_found_open_text: "Tin báo không tìm thấy giveaway đang mở theo ID đã nhập.",
  giveaway_keyword_required_text: "Tin nhắc member nhập đúng từ khóa bắt buộc khi tham gia.",
  giveaway_joined_text: "Tin xác nhận member đã tham gia giveaway thành công.",
  giveaway_join_duplicate_text: "Tin báo member đã tham gia giveaway này rồi.",
  giveaway_draw_usage_text: "Hướng dẫn admin dùng /draw để quay người thắng.",
  giveaway_not_found_text: "Tin báo không tìm thấy giveaway theo ID.",
  giveaway_no_entries_text: "Tin báo giveaway chưa có người tham gia nên chưa quay được.",
  giveaway_result_text: "Mẫu tin công bố kết quả quay giveaway.",
  giveaway_close_usage_text: "Hướng dẫn admin đóng giveaway.",
  giveaway_closed_text: "Tin xác nhận giveaway đã được đóng."
};
const defaultBulkDefaults: BulkDefaults = {
  bot_key: "main",
  pool: "default",
  weight: 1,
  action: "delete",
  match: "contains",
  reason: "Từ khóa cấm",
  risk: "scam",
  risk_level: "scam",
  status: "confirmed",
  source: "cp_bulk",
  enabled: true
};

function emptyValues(table: TableConfig) {
  const values: Row = {};
  for (const field of table.fields) {
    if (field.type === "boolean") {
      values[field.key] = field.key === "enabled" || defaultBoolean.has(field.key);
    } else if (field.key === "bot_key") {
      values[field.key] = "main";
    } else if (field.key === "pool" || field.key.endsWith("_pool")) {
      values[field.key] = "default";
    } else if (field.key === "weight") {
      values[field.key] = 1;
    } else if (field.key === "settings") {
      values[field.key] = "{}";
    } else if (field.key === "status") {
      values[field.key] = "active";
    } else if (field.key === "role") {
      values[field.key] = "member";
    } else if (field.key === "action") {
      values[field.key] = "delete";
    } else if (field.key === "match") {
      values[field.key] = "contains";
    } else {
      values[field.key] = "";
    }
  }
  return values;
}

function draftFromRow(row: Row) {
  const draft = { ...row };
  for (const [key, value] of Object.entries(draft)) {
    if (value && typeof value === "object") {
      draft[key] = JSON.stringify(value, null, 2);
    }
  }
  return draft;
}

function titleFor(row: Row, table: TableConfig) {
  if (table.key === "config") {
    return CONFIG_LABELS[String(row.key || "")] || String(row.key || "Cài đặt").replaceAll("_", " ");
  }
  return row[table.titleField] || row.key || row.message || row.keyword || row.group_id || `#${row.id}`;
}

function configLabel(key: string) {
  return CONFIG_LABELS[key] || key.replaceAll("_", " ");
}

function configDescription(row: Row) {
  const key = String(row.key || "");
  return CONFIG_DESCRIPTIONS[key] || String(row.notes || "Cài đặt nâng cao dùng cho vận hành bot.");
}

function isConfigBoolean(row: Row) {
  const value = String(row.value ?? "").trim().toLowerCase();
  return ["true", "false"].includes(value);
}

function configDisplayValue(row: Row) {
  const key = String(row.key || "");
  const value = String(row.value ?? "");
  const lower = value.trim().toLowerCase();
  const actions: Record<string, string> = {
    delete: "Xóa tin",
    warn: "Cảnh báo",
    mute: "Mute tạm",
    kick: "Kick khỏi nhóm",
    ban: "Ban khỏi nhóm",
    restrict: "Hạn chế chat"
  };
  if (lower === "true") {
    return "Bật";
  }
  if (lower === "false") {
    return "Tắt";
  }
  if (key.endsWith("_seconds") && value !== "") {
    const seconds = Number(value);
    if (seconds === 0) {
      return key === "ban_seconds" ? "Vĩnh viễn" : "Không giới hạn / không tự xóa";
    }
    if (Number.isFinite(seconds)) {
      const minutes = seconds / 60;
      return minutes >= 1 ? `${seconds} giây (${minutes.toLocaleString("vi-VN")} phút)` : `${seconds} giây`;
    }
  }
  return actions[lower] || displayValue(row.value);
}

function configValueCaption(row: Row) {
  const key = String(row.key || "");
  if (key.endsWith("_seconds")) {
    return "Thời gian đang áp dụng";
  }
  if (key.endsWith("_text") || key.includes("text")) {
    return "Nội dung bot sẽ gửi";
  }
  if (key.includes("command")) {
    return "Danh sách lệnh đang bật";
  }
  if (isConfigBoolean(row)) {
    return "Trạng thái giá trị";
  }
  return "Giá trị hiện tại";
}

function fieldByKey(table: TableConfig, key: string) {
  return table.fields.find((field) => field.key === key);
}

function displayValue(value: unknown) {
  if (value === true) {
    return "Bật";
  }
  if (value === false) {
    return "Tắt";
  }
  if (value === null || value === undefined || value === "") {
    return "Chưa đặt";
  }
  return String(value);
}

function metricLabel(key: string) {
  const labels: Record<string, string> = {
    member_count: "Tổng thành viên",
    active_members: "Thành viên hoạt động",
    deleted_messages: "Tin đã xóa",
    spam_events: "Sự kiện spam",
    scam_reports: "Báo cáo scam",
    verified_members: "Đã xác minh"
  };
  return labels[key] || key;
}

function metricPeriod(period: string) {
  const labels: Record<string, string> = {
    today: "Hôm nay",
    week: "Tuần này",
    month: "Tháng này",
    all_time: "Tất cả"
  };
  return labels[period] || period || "Chưa đặt";
}

function metricValue(row: Row) {
  const value = Number(row.metric_value || 0);
  return Number.isFinite(value) ? value.toLocaleString("vi-VN") : displayValue(row.metric_value);
}

function previewText(row: Row, table: TableConfig) {
  const key = table.titleField;
  const raw = row[key] || row.value || row.reason || row.notes || "";
  return String(raw).replace(/\s+/g, " ").trim();
}

function statusClass(row: Row) {
  if (row.enabled === false || row.status === "paused" || row.status === "closed" || row.status === "rejected") {
    return "off";
  }
  if (row.status === "pending" || row.status === "draft") {
    return "pending";
  }
  return "on";
}

function statusText(row: Row) {
  if (row.enabled === false) {
    return "Tắt";
  }
  const labels: Record<string, string> = {
    active: "Đang chạy",
    open: "Đang mở",
    drawn: "Đã quay",
    closed: "Đã đóng",
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    rejected: "Từ chối",
    draft: "Nháp"
  };
  return labels[String(row.status || "")] || "Bật";
}

function heroFor(activeKey: string) {
  if (["keywords", "domain_blacklist", "link_shorteners", "verification_settings", "captcha_questions", "bot_allowlist"].includes(activeKey)) {
    return { title: "Trung tâm bảo mật", desc: "Chặn spam, link xấu, captcha và quyền bot bằng các lựa chọn rõ ràng.", icon: ShieldCheck, tone: "security" };
  }
  if (["messages", "video_messages", "auto_replies", "scheduled_posts"].includes(activeKey)) {
    return { title: "Trung tâm nội dung", desc: "Quản lý tin nhắn, video, auto reply và lịch gửi theo group.", icon: Sparkles, tone: "content" };
  }
  if (["scam_entities", "scam_reports"].includes(activeKey)) {
    return { title: "Trung tâm chống scam", desc: "Tra cứu, báo cáo và duyệt dữ liệu lừa đảo từ thành viên.", icon: Archive, tone: "scam" };
  }
  if (["giveaway_campaigns", "giveaway_entries", "entertainment_events", "reputation_rules"].includes(activeKey)) {
    return { title: "Trung tâm tương tác", desc: "Giveaway, event, điểm tương tác và các hoạt động giữ group sống.", icon: Gift, tone: "fun" };
  }
  return { title: "Bảng điều khiển", desc: "Chọn bot, chọn group, rồi cấu hình từng module bằng thao tác thân thiện.", icon: BarChart3, tone: "main" };
}

function workflowFor(tableKey: string, rows: Row[], selectedCount: number) {
  if (tableKey === "keywords") {
    const actions = ["delete", "warn", "mute", "kick", "ban"].map((action) => ({
      label: action,
      count: rows.filter((row) => row.action === action).length
    }));
    return {
      title: "Quy trình chặn nội dung xấu",
      body: "Paste nhiều từ khóa một lần, chọn hành động mặc định, rồi bật/tắt hoặc xóa hàng loạt ngay trong danh sách.",
      icon: ShieldCheck,
      chips: [
        { label: "Đang chọn", value: selectedCount },
        { label: "Đang bật", value: rows.filter((row) => row.enabled !== false).length },
        ...actions.map((item) => ({ label: item.label, value: item.count }))
      ]
    };
  }
  if (tableKey === "messages") {
    const pools = uniqueValues(rows, "pool");
    return {
      title: "Kho tin nhắn theo nhóm nội dung",
      body: "Mỗi group chỉ cần chọn đúng Nhóm nội dung. Bot sẽ lấy ngẫu nhiên các tin đang bật trong nhóm đó.",
      icon: Sparkles,
      chips: [
        { label: "Nhóm nội dung", value: pools.length },
        { label: "Tin đang bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Đang chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "auto_replies") {
    return {
      title: "Câu hỏi tự trả lời",
      body: "Tạo cặp Câu kích hoạt -> Nội dung trả lời. Kiểu contains phù hợp cho các câu như giá, support, rule.",
      icon: Activity,
      chips: [
        { label: "Câu trả lời", value: rows.length },
        { label: "Regex", value: rows.filter((row) => row.match === "regex").length },
        { label: "Đang bật", value: rows.filter((row) => row.enabled !== false).length }
      ]
    };
  }
  if (tableKey === "video_messages") {
    const pools = uniqueValues(rows, "pool");
    return {
      title: "Kho video để bot copy",
      body: "Lưu source chat ID và message ID. Group sẽ lấy video theo Nhóm video, tương tự như tin nhắn.",
      icon: Archive,
      chips: [
        { label: "Nhóm video", value: pools.length },
        { label: "Video đang bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Đang chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "giveaway_campaigns") {
    return {
      title: "Giveaway và quay số",
      body: "Tạo chiến dịch, đặt phần thưởng, số người thắng và trạng thái. Lượt tham gia nằm ở mục Lượt tham gia.",
      icon: Gift,
      chips: [
        { label: "Đang mở", value: rows.filter((row) => row.status === "open").length },
        { label: "Đã quay", value: rows.filter((row) => row.status === "drawn").length },
        { label: "Đang chọn", value: selectedCount }
      ]
    };
  }
  return null;
}

function groupedFields(table: TableConfig) {
  const groups: Record<string, FieldConfig[]> = {};
  for (const field of table.fields) {
    const section = field.section || "Thông tin";
    groups[section] = groups[section] || [];
    groups[section].push(field);
  }
  return Object.entries(groups);
}

function splitBulkLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseDelimited(line: string) {
  const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : line.includes(",") ? "," : "";
  if (!delimiter) {
    return [line];
  }
  return line.split(delimiter).map((part) => part.trim());
}

function parseSheetOrPipe(line: string) {
  const delimiter = line.includes("\t") ? "\t" : line.includes("|") ? "|" : "";
  if (!delimiter) {
    return [line.trim()];
  }
  return line.split(delimiter).map((part) => part.trim());
}

function parseBulkRows(tableKey: string, text: string, defaults: BulkDefaults): BulkRow[] {
  const lines = splitBulkLines(text);
  if (tableKey === "messages") {
    return lines.map((line): BulkRow => {
      const [message, pool = defaults.pool, weight = String(defaults.weight)] = parseSheetOrPipe(line);
      return { bot_key: defaults.bot_key, message, pool: pool || defaults.pool, weight: Number(weight) || defaults.weight, enabled: defaults.enabled };
    }).filter((row) => Boolean(row.message));
  }

  if (tableKey === "keywords") {
    return lines.map((line): BulkRow => {
      const [keyword, actionOrMatch = defaults.action, reason = defaults.reason] = parseDelimited(line);
      const isMatch = ["contains", "regex"].includes(actionOrMatch);
      return {
        bot_key: defaults.bot_key,
        keyword,
        match: isMatch ? actionOrMatch : defaults.match,
        action: isMatch ? defaults.action : actionOrMatch || defaults.action,
        reason: reason || defaults.reason,
        enabled: defaults.enabled
      };
    }).filter((row) => Boolean(row.keyword));
  }

  if (tableKey === "video_messages") {
    return lines.map((line): BulkRow => {
      const parts = parseSheetOrPipe(line);
      const numbers = line.match(/-?\d{5,}/g) || [];
      const fromChatId = parts[0]?.startsWith("-100") ? parts[0] : numbers[0] || "";
      const messageId = parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : numbers[1] || "";
      const caption = parts.length >= 3 ? parts.slice(2).join(" ") : "";
      return {
        bot_key: defaults.bot_key,
        from_chat_id: fromChatId,
        message_id: messageId,
        caption,
        pool: defaults.pool,
        weight: defaults.weight,
        enabled: defaults.enabled && Boolean(fromChatId && messageId)
      };
    }).filter((row) => row.from_chat_id && row.message_id);
  }

  if (tableKey === "scam_entities") {
    return lines.map((line): BulkRow => {
      const parts = parseDelimited(line);
      const raw = parts.join(" ");
      const username = raw.match(/@([a-zA-Z0-9_]{5,})/)?.[1] || "";
      const numbers = raw.match(/\b\d{6,}\b/g) || [];
      return {
        bot_key: defaults.bot_key,
        uid: parts[0]?.match(/^\d{6,}$/) ? parts[0] : numbers[0] || "",
        username,
        bank_account: parts[1] && /^\d{6,}$/.test(parts[1]) ? parts[1] : numbers[1] || "",
        phone: numbers.find((item) => [9, 10, 11].includes(item.length)) || "",
        name: "",
        risk_level: defaults.risk_level,
        reason: parts[2] || defaults.reason || "Dữ liệu scam",
        evidence: line,
        source: defaults.source,
        status: defaults.status,
        enabled: defaults.enabled
      };
    });
  }

  if (tableKey === "domain_blacklist" || tableKey === "link_shorteners") {
    return lines.map((line): BulkRow => {
      const [domain, action = defaults.action, notes = ""] = parseDelimited(line);
      return tableKey === "domain_blacklist"
        ? { bot_key: defaults.bot_key, domain, risk: defaults.risk, action: action || defaults.action, enabled: defaults.enabled, notes }
        : { bot_key: defaults.bot_key, domain, action: action || defaults.action, enabled: defaults.enabled, notes };
    }).filter((row) => Boolean(row.domain));
  }

  if (tableKey === "auto_replies") {
    return lines.map((line): BulkRow => {
      const [trigger, reply = "", match = defaults.match] = parseDelimited(line);
      return { bot_key: defaults.bot_key, trigger, reply, match: match || defaults.match, enabled: defaults.enabled };
    }).filter((row) => row.trigger && row.reply);
  }

  return [];
}

function bulkHint(tableKey: string) {
  if (tableKey === "messages") {
    return "Mỗi dòng là một tin nhắn. Nếu cần cột riêng hãy dùng tab từ Sheet hoặc dấu |: nội dung | nhóm nội dung | độ ưu tiên. Dấu phẩy trong nội dung sẽ được giữ nguyên.";
  }
  if (tableKey === "keywords") {
    return "Mỗi dòng là một từ khóa. Có thể dùng: từ khóa | delete/warn/ban | lý do.";
  }
  if (tableKey === "video_messages") {
    return "Mỗi dòng gồm source chat ID và message ID. Dùng tab từ Sheet hoặc dấu |. Ví dụ: -1001234567890 | 456 | caption.";
  }
  if (tableKey === "scam_entities") {
    return "Mỗi dòng là một đối tượng scam. Có thể paste: uid | @username | số tài khoản | lý do.";
  }
  if (tableKey === "domain_blacklist") {
    return "Mỗi dòng là một domain scam/phishing. Có thể dùng: domain | delete/warn/ban | ghi chú.";
  }
  if (tableKey === "link_shorteners") {
    return "Mỗi dòng là một domain rút gọn. Có thể dùng: domain | delete/warn | ghi chú.";
  }
  if (tableKey === "auto_replies") {
    return "Mỗi dòng: câu hỏi | nội dung trả lời | contains/exact/regex.";
  }
  return "";
}

function groupedNav(tables: TableConfig[]) {
  const used = new Set<string>();
  const groups = NAV_GROUPS.map((group) => {
    const items = group.keys
      .map((key) => tables.find((table) => table.key === key))
      .filter((table): table is TableConfig => Boolean(table));
    items.forEach((item) => used.add(item.key));
    return { ...group, items };
  }).filter((group) => group.items.length);
  const other = tables.filter((table) => !used.has(table.key));
  return other.length ? [...groups, { label: "Khác", keys: [], items: other }] : groups;
}

function uniqueValues(rows: Row[], key: string) {
  return Array.from(new Set(rows.map((row) => String(row[key] || "").trim()).filter(Boolean))).sort();
}

function layerContainsTable(layer: (typeof SYSTEM_LAYERS)[number], tableKey: string) {
  return layer.tables.includes(tableKey);
}

export default function HomePage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [activeKey, setActiveKey] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Row>({});
  const [search, setSearch] = useState("");
  const [password, setPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDefaults, setBulkDefaults] = useState<BulkDefaults>(defaultBulkDefaults);
  const [selectedBot, setSelectedBot] = useState("main");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeConfigTab, setActiveConfigTab] = useState("");
  const [activeLayer, setActiveLayer] = useState("overview");
  const [activeModule, setActiveModule] = useState("moderation");
  const [lookups, setLookups] = useState<Lookups>({ bots: [], groups: [], messages: [], videos: [], moduleSettings: [] });

  useEffect(() => {
    const stored = window.localStorage.getItem("cu_bot_cp_password") || "";
    setSavedPassword(stored);
    setPassword(stored);
    fetch("/api/meta")
      .then((response) => response.json())
      .then((payload: Meta) => {
        setMeta(payload);
        setActiveKey(payload.tables.find((item) => item.key === "bot_metrics")?.key || payload.tables[0]?.key || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const table = useMemo(() => meta?.tables.find((item) => item.key === activeKey), [activeKey, meta]);
  const parsedBulkRows = useMemo(() => (table ? parseBulkRows(table.key, bulkText, bulkDefaults) : []), [bulkText, bulkDefaults, table]);
  const activeGuide = table ? TABLE_GUIDES[table.key] : undefined;
  const messagePools = useMemo(() => uniqueValues(lookups.messages, "pool"), [lookups.messages]);
  const videoPools = useMemo(() => uniqueValues(lookups.videos, "pool"), [lookups.videos]);
  const hero = useMemo(() => heroFor(activeKey), [activeKey]);
  const HeroIcon = hero.icon;
  const currentBot = useMemo(() => lookups.bots.find((bot) => bot.bot_key === selectedBot), [lookups.bots, selectedBot]);
  const visibleRows = useMemo(() => rows.filter((row) => {
    if (table?.key === "bots" && selectedBot && row.bot_key !== selectedBot) {
      return false;
    }
    if (table?.key !== "bots" && selectedBot && row.bot_key && row.bot_key !== selectedBot) {
      return false;
    }
    if (selectedGroup) {
      const rowGroup = String(row.group_id || row.chat_id || "");
      if (rowGroup && rowGroup !== selectedGroup) {
        return false;
      }
    }
    return true;
  }), [rows, selectedBot, selectedGroup, table?.key]);
  const selectedVisibleRows = useMemo(() => visibleRows.filter((row) => selectedIds.has(String(row.id))), [visibleRows, selectedIds]);
  const workflow = useMemo(() => workflowFor(activeKey, visibleRows, selectedVisibleRows.length), [activeKey, visibleRows, selectedVisibleRows.length]);
  const WorkflowIcon = workflow?.icon;
  const dashboardRows = useMemo(() => visibleRows.filter((row) => table?.key === "bot_metrics" && row.enabled !== false), [visibleRows, table?.key]);
  const configTabs = useMemo(() => {
    const usedKeys = new Set(CONFIG_SECTIONS.flatMap((section) => section.keys));
    const baseTabs = CONFIG_SECTIONS.map((section) => ({
      ...section,
      rows: visibleRows.filter((row) => section.keys.includes(String(row.key || "")))
    }));
    const otherRows = visibleRows.filter((row) => !usedKeys.has(String(row.key || "")));
    return [
      ...baseTabs,
      {
        title: "Cài đặt khác",
        desc: "Các cài đặt nâng cao chưa thuộc nhóm chính.",
        icon: SlidersHorizontal,
        tone: "main",
        keys: [],
        rows: otherRows
      }
    ];
  }, [visibleRows]);
  const activeConfigSection = useMemo(() => configTabs.find((section) => section.title === activeConfigTab), [activeConfigTab, configTabs]);
  const ActiveConfigIcon = activeConfigSection?.icon;
  const metricGroups = useMemo(() => {
    const groups: Record<string, Row[]> = {};
    for (const row of dashboardRows) {
      const period = String(row.period || "today");
      groups[period] = groups[period] || [];
      groups[period].push(row);
    }
    return Object.entries(groups);
  }, [dashboardRows]);
  const activeModuleHub = useMemo(() => MODULE_HUBS.find((module) => module.key === activeModule) || MODULE_HUBS[0], [activeModule]);
  const ActiveModuleIcon = activeModuleHub.icon;
  const moduleRows = useMemo(() => lookups.moduleSettings.filter((row) => !selectedBot || row.bot_key === selectedBot), [lookups.moduleSettings, selectedBot]);
  const moduleState = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of moduleRows) {
      map.set(String(row.module_key || ""), row);
    }
    return map;
  }, [moduleRows]);
  const moduleEnabled = useMemo(() => {
    const keys = activeModuleHub.moduleKeys || [activeModuleHub.key];
    const states = keys.map((key) => moduleState.get(key)).filter(Boolean);
    if (!states.length) {
      return true;
    }
    return states.some((row) => row?.enabled !== false);
  }, [activeModuleHub, moduleState]);
  const activeLayerHub = useMemo(() => SYSTEM_LAYERS.find((layer) => layer.key === activeLayer) || SYSTEM_LAYERS[0], [activeLayer]);
  const ActiveLayerIcon = activeLayerHub.icon;
  const layerTables = useMemo(() => activeLayerHub.tables
    .map((key) => meta?.tables.find((tableItem) => tableItem.key === key))
    .filter((item): item is TableConfig => Boolean(item)), [activeLayerHub, meta?.tables]);
  const healthSummary = useMemo(() => {
    const activeBots = lookups.bots.filter((bot) => bot.enabled !== false && bot.status !== "paused").length;
    const disabledBots = lookups.bots.filter((bot) => bot.enabled === false || bot.status === "paused").length;
    const scopedGroups = lookups.groups.filter((group) => !selectedBot || !group.bot_key || group.bot_key === selectedBot);
    const offModules = moduleRows.filter((row) => row.enabled === false).length;
    const missingSetup = [
      scopedGroups.length === 0,
      lookups.messages.filter((row) => !selectedBot || !row.bot_key || row.bot_key === selectedBot).length === 0,
      moduleRows.length === 0
    ].filter(Boolean).length;
    return {
      activeBots,
      disabledBots,
      groups: scopedGroups.length,
      enabledModules: moduleRows.filter((row) => row.enabled !== false).length,
      offModules,
      missingSetup,
      issues: disabledBots + offModules + missingSetup
    };
  }, [lookups.bots, lookups.groups, lookups.messages, moduleRows, selectedBot]);

  async function api(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json");
    if (savedPassword) {
      headers.set("x-cp-password", savedPassword);
    }
    const response = await fetch(path, { ...init, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        window.localStorage.removeItem("cu_bot_cp_password");
        setSavedPassword("");
      }
      throw new Error(payload.error || "Request failed.");
    }
    return payload;
  }

  async function loadLookups() {
    try {
      const [botsPayload, groupsPayload, messagesPayload, videosPayload, modulePayload] = await Promise.all([
        api("/api/bots"),
        api("/api/groups"),
        api("/api/messages"),
        api("/api/video_messages"),
        api("/api/module_settings")
      ]);
      setLookups({
        bots: botsPayload.rows || [],
        groups: groupsPayload.rows || [],
        messages: messagesPayload.rows || [],
        videos: videosPayload.rows || [],
        moduleSettings: modulePayload.rows || []
      });
    } catch {
      setLookups({ bots: [], groups: [], messages: [], videos: [], moduleSettings: [] });
    }
  }

  async function loadRows(nextSearch = search) {
    if (!table) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = nextSearch ? `?search=${encodeURIComponent(nextSearch)}` : "";
      const payload = await api(`/api/${table.key}${query}`);
      setRows(payload.rows || []);
      setSelected(null);
      setDraft({});
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load rows.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (table && (!meta?.passwordRequired || savedPassword)) {
      void loadRows("");
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, savedPassword, table?.key]);

  useEffect(() => {
    if (meta && (!meta.passwordRequired || savedPassword)) {
      void loadLookups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.passwordRequired, savedPassword]);

  useEffect(() => {
    if (!lookups.bots.length || activeKey === "bots") {
      return;
    }
    if (!selectedBot || !lookups.bots.some((bot) => bot.bot_key === selectedBot)) {
      setSelectedBot(String(lookups.bots[0].bot_key || "main"));
    }
  }, [activeKey, lookups.bots, selectedBot]);

  useEffect(() => {
    if (selectedBot) {
      setBulkDefaults((current) => ({ ...current, bot_key: selectedBot }));
    }
  }, [selectedBot]);

  useEffect(() => {
    const matchingModule = MODULE_HUBS.find((module) => module.tables.includes(activeKey));
    if (matchingModule && matchingModule.key !== activeModule) {
      setActiveModule(matchingModule.key);
    }
  }, [activeKey, activeModule]);

  useEffect(() => {
    const currentLayer = SYSTEM_LAYERS.find((layer) => layer.key === activeLayer);
    if (currentLayer && layerContainsTable(currentLayer, activeKey)) {
      return;
    }
    const matchingLayer = SYSTEM_LAYERS.find((layer) => layerContainsTable(layer, activeKey));
    if (matchingLayer) {
      setActiveLayer(matchingLayer.key);
    }
  }, [activeKey, activeLayer]);

  function selectLayer(layerKey: string) {
    const layer = SYSTEM_LAYERS.find((item) => item.key === layerKey);
    if (!layer) {
      return;
    }
    setActiveLayer(layer.key);
    if (!layerContainsTable(layer, activeKey)) {
      setActiveKey(layer.tables[0]);
    }
    setSelected(null);
    setDraft({});
    setSelectedIds(new Set());
  }

  function startCreate() {
    if (!table) {
      return;
    }
    setSelected(null);
    const nextDraft = emptyValues(table);
    if (table.key !== "bots" && selectedBot && table.fields.some((field) => field.key === "bot_key")) {
      nextDraft.bot_key = selectedBot;
    }
    if (selectedGroup) {
      if (table.fields.some((field) => field.key === "group_id")) {
        nextDraft.group_id = selectedGroup;
      }
      if (table.fields.some((field) => field.key === "chat_id")) {
        nextDraft.chat_id = selectedGroup;
      }
    }
    setDraft(nextDraft);
    setNotice("");
  }

  async function saveBulk() {
    if (!table) {
      return;
    }
    const parsed = parseBulkRows(table.key, bulkText, bulkDefaults);
    if (!parsed.length) {
      setError("Không nhận diện được dữ liệu. Kiểm tra lại nội dung vừa paste.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/${table.key}`, {
        method: "POST",
        body: JSON.stringify({ rows: parsed })
      });
      setNotice(`Đã thêm ${parsed.length} mục.`);
      setBulkText("");
      setBulkOpen(false);
      await loadRows(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể nhập hàng loạt.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row: Row) {
    setSelected(row);
    setDraft(draftFromRow(row));
    setNotice("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!table) {
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (selected?.id) {
        await api(`/api/${table.key}`, {
          method: "PATCH",
          body: JSON.stringify({ id: selected.id, values: draft })
        });
      } else {
        await api(`/api/${table.key}`, {
          method: "POST",
          body: JSON.stringify(draft)
        });
      }
      setNotice("Đã lưu thay đổi.");
      await loadRows(search);
      if (table.key === "bots") {
        await loadLookups();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRowValues(row: Row, values: Row) {
    if (!table) {
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/${table.key}`, {
        method: "PATCH",
        body: JSON.stringify({ id: row.id, values })
      });
      setNotice("Đã lưu thay đổi.");
      await loadRows(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveTableRowValues(tableKey: string, row: Row, values: Row) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/${tableKey}`, {
        method: "PATCH",
        body: JSON.stringify({ id: row.id, values })
      });
      setNotice("Đã lưu thay đổi.");
      if (tableKey === table?.key) {
        await loadRows(search);
      }
      await loadLookups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save.");
    } finally {
      setSaving(false);
    }
  }

  function selectBot(botKey: string) {
    setSelectedBot(botKey);
    setSelectedGroup("");
    setSelected(null);
    setDraft({});
    setSelectedIds(new Set());
  }

  async function toggleModule(moduleKey: string) {
    const row = moduleState.get(moduleKey);
    if (!row) {
      const moduleInfo = MODULE_HUBS.find((module) => module.key === moduleKey);
      setSaving(true);
      setError("");
      setNotice("");
      try {
        await api("/api/module_settings", {
          method: "POST",
          body: JSON.stringify({
            bot_key: selectedBot || "main",
            module_key: moduleKey,
            module_name: moduleInfo?.title || moduleKey,
            category: moduleInfo?.title === "Giải trí" ? "Giải trí" : "Bảo mật",
            settings: "{}",
            enabled: true
          })
        });
        setNotice("Đã tạo và bật module.");
        await loadLookups();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cannot create module.");
      } finally {
        setSaving(false);
      }
      return;
    }
    await saveTableRowValues("module_settings", row, {
      ...row,
      enabled: row.enabled === false
    });
  }

  async function toggleConfigValue(row: Row) {
    const nextValue = String(row.value ?? "").trim().toLowerCase() === "true" ? "false" : "true";
    await saveRowValues(row, { ...row, value: nextValue });
  }

  async function remove(row: Row) {
    if (!table || !window.confirm(`Xóa "${titleFor(row, table)}"?`)) {
      return;
    }
    setError("");
    try {
      await api(`/api/${table.key}?id=${row.id}`, { method: "DELETE" });
      await loadRows(search);
      if (table.key === "bots") {
        await loadLookups();
      }
      setNotice("Đã xóa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete.");
    }
  }

  async function removeSelected() {
    if (!table || !selectedVisibleRows.length || !window.confirm(`Xóa ${selectedVisibleRows.length} mục đã chọn?`)) {
      return;
    }
    setError("");
    setSaving(true);
    try {
      for (const row of selectedVisibleRows) {
        await api(`/api/${table.key}?id=${row.id}`, { method: "DELETE" });
      }
      setSelectedIds(new Set());
      await loadRows(search);
      if (table.key === "bots") {
        await loadLookups();
      }
      setNotice(`Đã xóa ${selectedVisibleRows.length} mục.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot delete selected rows.");
    } finally {
      setSaving(false);
    }
  }

  async function unlock(event: FormEvent) {
    event.preventDefault();
    window.localStorage.setItem("cu_bot_cp_password", password);
    setSavedPassword(password);
  }

  function updateField(field: FieldConfig, value: string | boolean) {
    setDraft((current) => ({
      ...current,
      [field.key]: field.type === "number" ? (value === "" ? "" : Number(value)) : value
    }));
  }

  function updateBulkDefault(key: keyof BulkDefaults, value: string | number | boolean) {
    setBulkDefaults((current) => ({
      ...current,
      [key]: key === "weight" ? Number(value) || 1 : value
    }));
  }

  function toggleSelected(id: unknown) {
    const key = String(id);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const visibleIds = visibleRows.map((row) => String(row.id));
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.has(id));
      const next = new Set(current);
      for (const id of visibleIds) {
        if (allSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  }

  function dataListForField(field: FieldConfig) {
    if (field.key === "bot_key") {
      return "bot-options";
    }
    if (field.key === "group_id" || field.key === "chat_id") {
      return "group-options";
    }
    if (field.key === "pool" || field.key === "message_pool") {
      return "message-pool-options";
    }
    if (field.key === "video_pool") {
      return "video-pool-options";
    }
    return undefined;
  }

  function lookupOptionsForField(field: FieldConfig) {
    if (field.key === "bot_key") {
      return lookups.bots.map((bot) => ({ value: String(bot.bot_key || ""), label: String(bot.name || bot.bot_key || "") })).filter((item) => item.value);
    }
    if (field.key === "group_id" || field.key === "chat_id") {
      return lookups.groups
        .filter((group) => !selectedBot || !group.bot_key || group.bot_key === selectedBot)
        .map((group) => {
          const value = String(group.group_id || group.chat_id || "");
          return { value, label: String(group.group_name || value) };
        })
        .filter((item) => item.value);
    }
    if (field.key === "pool" || field.key === "message_pool") {
      return messagePools.map((pool) => ({ value: pool, label: pool }));
    }
    if (field.key === "video_pool") {
      return videoPools.map((pool) => ({ value: pool, label: pool }));
    }
    return [];
  }

  function commandField(field: FieldConfig) {
    return field.key === "help_menu_commands" || (field.key === "value" && ["bot_menu_commands", "help_menu_commands"].includes(String(draft.key || "")));
  }

  function toggleCommand(field: FieldConfig, command: string) {
    const current = String(draft[field.key] || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const next = current.includes(command) ? current.filter((item) => item !== command) : [...current, command];
    updateField(field, next.join(","));
  }

  if (loading && !meta) {
    return (
      <main className="loading">
        <Loader2 className="spin" size={22} />
        Đang tải control panel
      </main>
    );
  }

  if (!meta || !table) {
    return <main className="loading">Không đọc được cấu hình control panel.</main>;
  }

  if (meta.passwordRequired && !savedPassword) {
    return (
      <main className="login-shell">
        <form className="login-panel" onSubmit={unlock}>
          <Database size={28} />
          <h1>Cu Bot CP</h1>
          <p>Nhập mật khẩu admin đã cấu hình trong Vercel.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="CP_ADMIN_PASSWORD"
            autoFocus
          />
          <button type="submit">
            <Check size={17} />
            Đăng nhập
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Database size={24} />
          <div>
            <h1>Cu Bot CP</h1>
            <span>Điều khiển bot Telegram</span>
          </div>
        </div>
        <nav className="layer-nav">
          <section className="nav-group">
            <h2>System Layers</h2>
            {SYSTEM_LAYERS.map((layer) => {
              const LayerIcon = layer.icon;
              return (
                <button
                  key={layer.key}
                  className={layer.key === activeLayer ? "active" : ""}
                  onClick={() => selectLayer(layer.key)}
                  type="button"
                >
                  <LayerIcon size={17} />
                  <span>{layer.shortTitle}</span>
                </button>
              );
            })}
          </section>
        </nav>
      </aside>

      <section className="workspace">
        <section className="bot-context">
          <div className="bot-context-copy">
            <span>Context đang điều khiển</span>
            <strong>{currentBot?.name || selectedBot || "Tất cả bot"}</strong>
            <p>
              Group: {selectedGroup || "Tất cả"} · Module: {activeModuleHub.title} · Màn hình: {table.label}
            </p>
          </div>
          <div className="bot-switcher">
            {activeKey === "bots" ? (
              <button type="button" className={!selectedBot ? "active" : ""} onClick={() => selectBot("")}>
                <Bot size={16} />
                Tất cả
              </button>
            ) : null}
            {lookups.bots.map((bot) => (
              <button
                key={bot.bot_key || bot.id}
                type="button"
                className={bot.bot_key === selectedBot ? "active" : ""}
                onClick={() => selectBot(String(bot.bot_key || ""))}
              >
                <Bot size={16} />
                {bot.name || bot.bot_key}
              </button>
            ))}
            {!lookups.bots.length ? (
              <button type="button" className="active" onClick={() => setActiveKey("bots")}>
                <Plus size={16} />
                Thêm bot
              </button>
            ) : null}
          </div>
        </section>

        <section className="status-dashboard">
          <article className={healthSummary.disabledBots ? "status-card warning" : "status-card ok"}>
            <span>Bot online</span>
            <strong>{healthSummary.activeBots}</strong>
            <p>{healthSummary.disabledBots ? `${healthSummary.disabledBots} bot đang tắt` : "Các bot chính đang sẵn sàng"}</p>
          </article>
          <article className={healthSummary.offModules ? "status-card warning" : "status-card ok"}>
            <span>Module đang chạy</span>
            <strong>{healthSummary.enabledModules}</strong>
            <p>{healthSummary.offModules ? `${healthSummary.offModules} module đang tắt` : "Không có module bị tắt"}</p>
          </article>
          <article className={healthSummary.groups ? "status-card ok" : "status-card warning"}>
            <span>Group đã nối</span>
            <strong>{healthSummary.groups}</strong>
            <p>{healthSummary.groups ? "Bot có phạm vi hoạt động" : "Chưa có group cho bot này"}</p>
          </article>
          <article className={healthSummary.issues ? "status-card danger" : "status-card ok"}>
            <span>Cần xử lý</span>
            <strong>{healthSummary.issues}</strong>
            <p>{healthSummary.issues ? "Bấm Quick setup hoặc mở module lỗi" : "Hệ thống không có cảnh báo rõ ràng"}</p>
          </article>
        </section>

        <section className={`layer-workbench ${activeLayerHub.tone}`}>
          <div className="layer-copy">
            <div className="layer-icon">
              <ActiveLayerIcon size={24} />
            </div>
            <div>
              <span>Kiến trúc vận hành</span>
              <h3>{activeLayerHub.title}</h3>
              <p>{activeLayerHub.desc}</p>
            </div>
          </div>
          <div className="layer-links">
            {layerTables.map((item) => (
              <button key={item.key} type="button" className={activeKey === item.key ? "active" : ""} onClick={() => setActiveKey(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="scope-bar">
          <label>
            <span>{activeKey === "bots" ? "Hiển thị bot" : "Bot đang cấu hình"}</span>
            <select value={selectedBot} onChange={(event) => selectBot(event.target.value)}>
              {activeKey === "bots" ? <option value="">Tất cả bot</option> : null}
              {lookups.bots.map((bot) => (
                <option key={bot.bot_key || bot.id} value={bot.bot_key || ""}>
                  {bot.name || bot.bot_key}
                </option>
              ))}
              {!lookups.bots.length ? <option value="main">main</option> : null}
            </select>
          </label>
          <label>
            <span>Group/Kênh</span>
            <select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
              <option value="">Tất cả group/kênh</option>
              {lookups.groups
                .filter((group) => !selectedBot || !group.bot_key || group.bot_key === selectedBot)
                .map((group) => {
                  const groupId = group.group_id || group.chat_id || "";
                  return (
                    <option key={groupId || group.id} value={groupId}>
                      {group.group_name || groupId}
                    </option>
                  );
                })}
            </select>
          </label>
          <div className="scope-summary">
            <span>Đang xem</span>
            <strong>{visibleRows.length} mục phù hợp</strong>
          </div>
        </section>

        {activeLayer === "modules" ? (
        <section className="module-workbench">
          <div className="module-tabs" role="tablist" aria-label="Module chức năng">
            {MODULE_HUBS.map((module) => {
              const ModuleIcon = module.icon;
              const keys = module.moduleKeys || [module.key];
              const states = keys.map((key) => moduleState.get(key)).filter(Boolean);
              const isOn = states.length ? states.some((row) => row?.enabled !== false) : true;
              return (
                <button
                  key={module.key}
                  type="button"
                  className={`${module.key === activeModule ? "active" : ""} ${isOn ? "" : "off"}`}
                  onClick={() => {
                    setActiveModule(module.key);
                    if (!module.tables.includes(activeKey)) {
                      setActiveKey(module.tables[0]);
                    }
                  }}
                >
                  <ModuleIcon size={18} />
                  <div>
                    <span>{module.title}</span>
                    <p>{module.desc}</p>
                  </div>
                  <b>{isOn ? "Bật" : "Tắt"}</b>
                </button>
              );
            })}
          </div>
          <div className={`module-panel ${activeModuleHub.tone}`}>
            <div className="module-copy">
              <div className="module-icon">
                <ActiveModuleIcon size={22} />
              </div>
              <div>
                <h3>{activeModuleHub.title}</h3>
                <p>{activeModuleHub.desc}</p>
              </div>
            </div>
            <div className="module-actions">
              <button type="button" className="secondary" onClick={() => setActiveKey(activeModuleHub.tables[0])}>
                Quick setup
              </button>
              <button type="button" className="ghost" onClick={() => setActiveKey("module_settings")}>
                Chi tiết
              </button>
              {(activeModuleHub.moduleKeys || [activeModuleHub.key]).map((moduleKey) => {
                const row = moduleState.get(moduleKey);
                const isOn = !row || row.enabled !== false;
                return (
                  <button
                    key={moduleKey}
                    type="button"
                    className={`module-toggle ${isOn ? "on" : "off"}`}
                    disabled={saving}
                    onClick={() => toggleModule(moduleKey)}
                    title={isOn ? "Bấm để tắt module" : "Bấm để bật module"}
                  >
                    <Power size={15} />
                    {isOn ? "Bật" : "Tắt"}
                  </button>
                );
              })}
            </div>
            <div className="module-links">
              {moduleEnabled ? (
                activeModuleHub.tables.map((key) => {
                  const item = meta.tables.find((tableItem) => tableItem.key === key);
                  if (!item) {
                    return null;
                  }
                  return (
                    <button key={key} type="button" className={activeKey === key ? "active" : ""} onClick={() => setActiveKey(key)}>
                      {item.label}
                    </button>
                  );
                })
              ) : (
                <div className="module-off-note">
                  Module đang tắt nên các chức năng con được ẩn. Bật lại module để cấu hình chi tiết.
                </div>
              )}
            </div>
          </div>
        </section>
        ) : null}

        <header className="topbar">
          <div>
            <h2>{table.label}</h2>
            <p>{table.description}</p>
          </div>
          <div className="actions">
            <form
              className="search"
              onSubmit={(event) => {
                event.preventDefault();
                void loadRows(search);
              }}
            >
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm" />
            </form>
            <button type="button" className="icon-button" onClick={() => loadRows(search)} title="Tải lại">
              <RefreshCcw size={17} />
            </button>
            {table.key !== "config" ? (
              <>
                <button type="button" className="primary" onClick={startCreate}>
                  <Plus size={17} />
                  Thêm
                </button>
                <button type="button" className="secondary" onClick={toggleAllVisible} disabled={!visibleRows.length}>
                  <CheckSquare size={17} />
                  {selectedVisibleRows.length === visibleRows.length && visibleRows.length ? "Bỏ chọn" : "Chọn tất cả"}
                </button>
                {selectedVisibleRows.length ? (
                  <button type="button" className="danger" disabled={saving} onClick={removeSelected}>
                    <Trash2 size={17} />
                    Xóa {selectedVisibleRows.length} mục
                  </button>
                ) : null}
              </>
            ) : (
              <button type="button" className="secondary" onClick={() => setDraft({})} disabled={!Object.keys(draft).length}>
                <X size={17} />
                Đóng mục đang sửa
              </button>
            )}
            {bulkTables.has(table.key) ? (
              <button type="button" className="secondary" onClick={() => setBulkOpen((value) => !value)}>
                <Edit3 size={17} />
                Nhập nhanh
              </button>
            ) : null}
          </div>
        </header>

        {error ? <div className="alert error">{error}</div> : null}
        {notice ? <div className="alert success">{notice}</div> : null}

        {activeGuide ? (
          <section className="usage-guide">
            <div>
              <SlidersHorizontal size={19} />
              <div>
                <h3>{activeGuide.title}</h3>
                <p>{activeGuide.body}</p>
              </div>
            </div>
            <ol>
              {activeGuide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        ) : null}

        {workflow ? (
          <section className="workflow-panel">
            <div className="workflow-copy">
              <div className="workflow-icon">
                {WorkflowIcon ? <WorkflowIcon size={22} /> : null}
              </div>
              <div>
                <h3>{workflow.title}</h3>
                <p>{workflow.body}</p>
              </div>
            </div>
            <div className="workflow-chips">
              {workflow.chips.map((chip) => (
                <span key={chip.label}>
                  <b>{chip.value}</b>
                  {chip.label}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {bulkOpen && bulkTables.has(table.key) ? (
          <section className="bulk-panel">
            <div className="bulk-copy">
              <Sparkles size={20} />
              <div>
                <h3>Paste nhiều dữ liệu</h3>
                <p>{bulkHint(table.key)}</p>
              </div>
            </div>
            <div className="bulk-defaults">
              <label>
                <span>Bot</span>
                <select value={bulkDefaults.bot_key} onChange={(event) => updateBulkDefault("bot_key", event.target.value)}>
                  {lookups.bots.map((bot) => (
                    <option key={bot.bot_key || bot.id} value={bot.bot_key || ""}>
                      {bot.name || bot.bot_key}
                    </option>
                  ))}
                  {!lookups.bots.length ? <option value="main">main</option> : null}
                </select>
              </label>
              {["messages", "video_messages"].includes(table.key) ? (
                <>
                  <label>
                    <span>Nhóm nội dung</span>
                    <input
                      value={bulkDefaults.pool}
                      onChange={(event) => updateBulkDefault("pool", event.target.value)}
                      list={table.key === "video_messages" ? "video-pool-options" : "message-pool-options"}
                      placeholder="Ví dụ: default, promo, rule"
                    />
                  </label>
                  <label>
                    <span>Độ ưu tiên</span>
                    <input type="number" value={bulkDefaults.weight} onChange={(event) => updateBulkDefault("weight", event.target.value)} />
                  </label>
                </>
              ) : null}
              {["keywords", "domain_blacklist", "link_shorteners"].includes(table.key) ? (
                <label>
                  <span>Hành động mặc định</span>
                  <select value={bulkDefaults.action} onChange={(event) => updateBulkDefault("action", event.target.value)}>
                    <option value="delete">delete</option>
                    <option value="warn">warn</option>
                    <option value="mute">mute</option>
                    <option value="kick">kick</option>
                    <option value="ban">ban</option>
                  </select>
                </label>
              ) : null}
              {["keywords", "auto_replies"].includes(table.key) ? (
                <label>
                  <span>Kiểu khớp</span>
                  <select value={bulkDefaults.match} onChange={(event) => updateBulkDefault("match", event.target.value)}>
                    <option value="contains">contains</option>
                    <option value="exact">exact</option>
                    <option value="regex">regex</option>
                  </select>
                </label>
              ) : null}
              {table.key === "keywords" || table.key === "scam_entities" ? (
                <label>
                  <span>Lý do mặc định</span>
                  <input value={bulkDefaults.reason} onChange={(event) => updateBulkDefault("reason", event.target.value)} />
                </label>
              ) : null}
              {table.key === "domain_blacklist" ? (
                <label>
                  <span>Loại rủi ro</span>
                  <select value={bulkDefaults.risk} onChange={(event) => updateBulkDefault("risk", event.target.value)}>
                    <option value="scam">scam</option>
                    <option value="phishing">phishing</option>
                    <option value="telegram_clone">telegram_clone</option>
                    <option value="nsfw">nsfw</option>
                  </select>
                </label>
              ) : null}
              {table.key === "scam_entities" ? (
                <>
                  <label>
                    <span>Mức rủi ro</span>
                    <select value={bulkDefaults.risk_level} onChange={(event) => updateBulkDefault("risk_level", event.target.value)}>
                      <option value="watch">watch</option>
                      <option value="suspicious">suspicious</option>
                      <option value="scam">scam</option>
                      <option value="danger">danger</option>
                    </select>
                  </label>
                  <label>
                    <span>Trạng thái</span>
                    <select value={bulkDefaults.status} onChange={(event) => updateBulkDefault("status", event.target.value)}>
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </label>
                </>
              ) : null}
              <label className="checkbox-field">
                <span>Bật sau khi nhập</span>
                <input type="checkbox" checked={bulkDefaults.enabled} onChange={(event) => updateBulkDefault("enabled", event.target.checked)} />
              </label>
            </div>
            <textarea
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder={bulkHint(table.key)}
              rows={6}
            />
            <div className="bulk-footer">
              <span>Nhận diện được {parsedBulkRows.length} mục</span>
              <div>
                <button type="button" className="ghost" onClick={() => setBulkText("")}>
                  Xóa nội dung
                </button>
                <button type="button" className="primary" disabled={saving || !parsedBulkRows.length} onClick={saveBulk}>
                  {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                  Lưu tất cả
                </button>
              </div>
            </div>
            {parsedBulkRows.length ? (
              <div className="bulk-preview">
                {parsedBulkRows.slice(0, 5).map((row, index) => (
                  <span key={`${index}-${JSON.stringify(row)}`}>
                    {index + 1}. {titleFor(row, table)}
                  </span>
                ))}
                {parsedBulkRows.length > 5 ? <span>... và {parsedBulkRows.length - 5} mục khác</span> : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {table.key === "bot_metrics" ? (
          <section className="metrics-dashboard">
            <div className="metrics-head">
              <div>
                <BarChart3 size={22} />
                <h3>Dashboard vận hành</h3>
              </div>
              <span>Dữ liệu lấy từ bảng bot_metrics trong Supabase</span>
            </div>
            <div className="metric-cards">
              {dashboardRows.map((row, index) => {
                const Icon = index % 3 === 0 ? Users : index % 3 === 1 ? Activity : TrendingUp;
                return (
                  <article className="metric-card" key={row.id || `${row.metric_key}-${row.period}`}>
                    <div className="metric-icon">
                      <Icon size={20} />
                    </div>
                    <span>{metricPeriod(String(row.period || ""))}</span>
                    <strong>{metricValue(row)}</strong>
                    <p>{metricLabel(String(row.metric_key || ""))}</p>
                    {row.notes ? <small>{row.notes}</small> : null}
                  </article>
                );
              })}
              {!dashboardRows.length && !loading ? (
                <div className="empty-state metrics-empty">
                  <ShieldCheck size={28} />
                  <strong>Chưa có dữ liệu thống kê</strong>
                  <span>Bấm Thêm để tạo chỉ số đầu tiên.</span>
                </div>
              ) : null}
            </div>
            {metricGroups.length ? (
              <div className="metric-groups">
                {metricGroups.map(([period, items]) => (
                  <section className="metric-group" key={period}>
                    <h4>{metricPeriod(period)}</h4>
                    <div>
                      {items.map((row) => (
                        <span key={row.id || row.metric_key}>
                          <b>{metricLabel(String(row.metric_key || ""))}</b>
                          {metricValue(row)}
                        </span>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {table.key === "config" ? (
          <section className="config-center">
            <div className="config-tabs" role="tablist" aria-label="Nhóm cài đặt">
              {configTabs.map((section) => {
                const TabIcon = section.icon;
                const active = activeConfigSection?.title === section.title;
                return (
                  <button
                    key={section.title}
                    type="button"
                    className={active ? "active" : ""}
                    onClick={() => {
                      setActiveConfigTab(active ? "" : section.title);
                      setDraft({});
                      setSelected(null);
                    }}
                  >
                    <TabIcon size={17} />
                    <span>{section.title}</span>
                    <b>{section.rows.length}</b>
                </button>
              );
            })}
            </div>

            {activeConfigSection ? (
              <section className={`config-section ${activeConfigSection.tone}`}>
                <div className="config-section-title">
                  <div className="config-section-icon">
                    {ActiveConfigIcon ? <ActiveConfigIcon size={22} /> : null}
                  </div>
                  <div>
                    <h4>{activeConfigSection.title}</h4>
                    <p>{activeConfigSection.desc}</p>
                  </div>
                </div>
                <div className="settings-grid">
                  {activeConfigSection.rows.map((row) => {
                    const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                    const booleanValue = isConfigBoolean(row);
                    const valueOn = String(row.value).toLowerCase() === "true";
                    return (
                      <article className={`setting-tile ${editing ? "editing" : ""} ${row.enabled === false ? "disabled" : ""}`} key={row.id || row.key}>
                        <div className="setting-top">
                          <div>
                            <h5>{configLabel(String(row.key || ""))}</h5>
                            <p>{configDescription(row)}</p>
                          </div>
                          <div className="setting-icon-actions">
                            {booleanValue ? (
                              <button
                                type="button"
                                className={`setting-toggle ${valueOn ? "on" : "off"}`}
                                disabled={saving}
                                onClick={() => toggleConfigValue(row)}
                                title={valueOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                              >
                                <Power size={16} />
                              </button>
                            ) : null}
                            <button type="button" className="setting-edit-button" onClick={() => startEdit(row)} title="Sửa">
                              <Edit3 size={16} />
                            </button>
                          </div>
                        </div>

                        {editing ? (
                          <form className="setting-edit" onSubmit={save}>
                            {booleanValue ? (
                              <label className="checkbox-field">
                                <span>Bật chức năng này</span>
                                <input
                                  type="checkbox"
                                  checked={String(draft.value).toLowerCase() === "true"}
                                  onChange={(event) => setDraft((current) => ({ ...current, value: event.target.checked ? "true" : "false" }))}
                                />
                              </label>
                            ) : (
                              <label>
                                <span>Nội dung / giá trị</span>
                                <textarea
                                  value={draft.value ?? ""}
                                  onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                                  rows={String(draft.value || "").length > 120 ? 6 : 3}
                                />
                              </label>
                            )}
                            <label className="checkbox-field">
                              <span>Kích hoạt cài đặt này</span>
                              <input
                                type="checkbox"
                                checked={Boolean(draft.enabled)}
                                onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
                              />
                            </label>
                            <div className="setting-edit-actions">
                              <button type="button" className="ghost" onClick={() => setDraft({})}>
                                Hủy
                              </button>
                              <button type="submit" className="primary" disabled={saving}>
                                {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                                Lưu
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="setting-value compact-value">
                            <span>{configValueCaption(row)}</span>
                            <strong>{configDisplayValue(row)}</strong>
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {!activeConfigSection.rows.length ? (
                    <div className="empty-state config-empty">
                      <SlidersHorizontal size={26} />
                      <strong>Chưa có cài đặt trong nhóm này</strong>
                      <span>Nhóm này vẫn được giữ để khi có key mới sẽ hiển thị tại đây.</span>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
            {!activeConfigSection ? (
              <section className="config-closed-state">
                <SlidersHorizontal size={28} />
                <strong>Advanced config đang được thu gọn</strong>
                <span>Chọn một nhóm cài đặt phía trên khi cần sửa sâu. Mặc định CP chỉ hiển thị trạng thái và hành động chính.</span>
              </section>
            ) : null}
          </section>
        ) : (
        <div className="content-grid">
          <section className="list-panel">
            <div className="list-header">
              <div>
                <strong>{visibleRows.length}</strong>
                <span> mục</span>
              </div>
              <span>{visibleRows.length !== rows.length ? `${visibleRows.length} mục theo bộ lọc` : "Chọn một mục để chỉnh sửa"}</span>
            </div>

            <div className="card-list">
              {visibleRows.map((row) => (
                <article className={`data-card ${selected?.id === row.id ? "selected" : ""}`} key={row.id}>
                  <label className="select-card" title="Chọn mục này">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(String(row.id))}
                      onChange={() => toggleSelected(row.id)}
                    />
                    <span />
                  </label>
                  <button className="card-main" type="button" onClick={() => startEdit(row)}>
                    <div className="card-title-row">
                      <h3>{titleFor(row, table)}</h3>
                      <span className={`status ${statusClass(row)}`}>
                        <Power size={13} />
                        {statusText(row)}
                      </span>
                    </div>
                    <p>{previewText(row, table) || "Chưa có nội dung mô tả."}</p>
                    <div className="meta-grid">
                      {table.summaryFields.map((key) => {
                        const field = fieldByKey(table, key);
                        return (
                          <span className="meta-pill" key={key}>
                            <b>{field?.label || key}</b>
                            {displayValue(row[key])}
                          </span>
                        );
                      })}
                    </div>
                  </button>
                  <div className="card-actions">
                    <button type="button" title="Sửa" onClick={() => startEdit(row)}>
                      <Edit3 size={16} />
                    </button>
                    <button type="button" title="Xóa" onClick={() => remove(row)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
              {!visibleRows.length && !loading ? (
                <div className="empty-state">
                  <ShieldCheck size={28} />
                  <strong>Chưa có dữ liệu</strong>
                  <span>Bấm Thêm để tạo mục đầu tiên.</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="editor-panel">
              {Object.keys(draft).length ? (
              <form onSubmit={save}>
                <div className="editor-title">
                  <h3>{selected ? "Chỉnh sửa" : "Thêm mới"}</h3>
                  <button type="button" className="icon-button" onClick={() => setDraft({})}>
                    <X size={17} />
                  </button>
                </div>
                <div className="fields">
                  {groupedFields(table).map(([section, fields]) => (
                    <section className="field-section" key={section}>
                      <h4>{section}</h4>
                      {fields.map((field) => {
                        const lookupOptions = lookupOptionsForField(field);
                        return (
                        <label key={field.key} className={field.type === "boolean" ? "switch-field" : ""}>
                          <span>{field.label}</span>
                          {field.type === "textarea" ? (
                            <>
                              <textarea
                                value={draft[field.key] ?? ""}
                                onChange={(event) => updateField(field, event.target.value)}
                                placeholder={field.placeholder}
                                rows={field.key === "message" || field.key === "policy_text" || field.key === "value" ? 6 : 3}
                              />
                              {commandField(field) ? (
                                <div className="command-picks">
                                  {COMMAND_OPTIONS.map((command) => {
                                    const selectedCommand = String(draft[field.key] || "").split(",").map((item) => item.trim()).includes(command);
                                    return (
                                      <button
                                        key={command}
                                        type="button"
                                        className={selectedCommand ? "picked" : ""}
                                        onClick={() => toggleCommand(field, command)}
                                      >
                                        {selectedCommand ? <Check size={13} /> : null}
                                        /{command}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </>
                          ) : field.type === "boolean" ? (
                            <span className={`switch-control ${Boolean(draft[field.key]) ? "checked" : ""}`}>
                              <input
                                type="checkbox"
                                checked={Boolean(draft[field.key])}
                                onChange={(event) => updateField(field, event.target.checked)}
                              />
                              <b />
                              <em>{Boolean(draft[field.key]) ? "Bật" : "Tắt"}</em>
                            </span>
                          ) : field.type === "select" || lookupOptions.length ? (
                            <select value={draft[field.key] ?? ""} onChange={(event) => updateField(field, event.target.value)}>
                              <option value="">Mặc định</option>
                              {(lookupOptions.length ? lookupOptions : field.options?.map((option) => ({ value: option, label: option })) || []).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              value={draft[field.key] ?? ""}
                              onChange={(event) => updateField(field, event.target.value)}
                              placeholder={field.placeholder}
                              list={dataListForField(field)}
                            />
                          )}
                          {field.helper ? <small>{field.helper}</small> : null}
                        </label>
                        );
                      })}
                    </section>
                  ))}
                </div>
                <datalist id="bot-options">
                  {lookups.bots.map((bot) => (
                    <option key={bot.bot_key || bot.id} value={bot.bot_key || ""}>
                      {bot.name || bot.bot_key}
                    </option>
                  ))}
                </datalist>
                <datalist id="group-options">
                  {lookups.groups.map((group) => {
                    const groupId = group.group_id || group.chat_id || "";
                    return (
                      <option key={groupId || group.id} value={groupId}>
                        {group.group_name || groupId}
                      </option>
                    );
                  })}
                </datalist>
                <datalist id="message-pool-options">
                  {messagePools.map((pool) => (
                    <option key={pool} value={pool} />
                  ))}
                </datalist>
                <datalist id="video-pool-options">
                  {videoPools.map((pool) => (
                    <option key={pool} value={pool} />
                  ))}
                </datalist>
                <button className="primary save" disabled={saving} type="submit">
                  {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                  Lưu
                </button>
              </form>
            ) : (
              <div className="placeholder">
                <Edit3 size={24} />
                Chọn một mục để sửa hoặc bấm Thêm.
              </div>
            )}
          </section>
        </div>
        )}
      </section>
    </main>
  );
}
