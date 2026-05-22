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
  envStatus?: {
    supabaseUrl: boolean;
    serviceRoleKey: boolean;
    cpPassword: boolean;
    botToken: boolean;
    botKey: boolean;
    runtimeMode: string;
  };
};
type Lookups = {
  bots: Row[];
  groups: Row[];
  messages: Row[];
  videos: Row[];
  moduleSettings: Row[];
  scamReports: Row[];
};
type CommandInsight = {
  severity: "critical" | "high" | "warning" | "info" | "healthy";
  title: string;
  body: string;
  impact: string;
  action: string;
  targetLayer: string;
  targetTable: string;
};
type WorkMode = "overview" | "operate" | "edit";
type RuleTestResult = {
  label: string;
  detail: string;
  matched: boolean;
};
type EmptyStateConfig = {
  title: string;
  body: string;
  action: string;
  steps: string[];
};

const defaultBoolean = new Set(["enabled", "daily_enabled", "delete_system_messages", "delete_forwarded_messages"]);
const CONFIG_BOOLEAN_KEYS = new Set([
  "delete_system_messages",
  "delete_forwarded_messages",
  "delete_inline_keyboard_messages",
  "delete_messages_from_bots",
  "remove_unknown_bots",
  "exempt_admins",
  "scan_bio_links",
  "bio_link_delete_message",
  "duplicate_message_enabled",
  "show_policy_button",
  "send_on_boot",
  "send_if_silent",
]);
const CONFIG_DEFAULT_VALUES: Record<string, string> = {
  warning_text: "{mention} cảnh báo vi phạm: {reason}\nSố lần cảnh báo: {count}/{limit}\nVui lòng dừng lại để tránh bị khóa hoặc ban.",
  forward_warning_reason: "Không cho phép chia sẻ Story/forward/trích dẫn nội dung từ nguồn bên ngoài vào nhóm.",
  forward_warning_text: "{mention} bạn đang gửi nội dung chuyển tiếp từ nguồn ngoài.\nLý do: {reason}\nCảnh báo: {count}/{limit}\nTiếp tục vi phạm sẽ bị xử lý mạnh hơn.",
  spam_restrict_text: "{mention} đã bị tạm khóa chat vì vi phạm: {reason}\nNếu cần hỗ trợ, liên hệ admin và chờ mở lại quyền chat.",
  bio_link_warning_text: "{mention} bio của bạn đang chứa link.\nVui lòng gỡ link trong bio rồi nhắn admin để được mở chat lại.",
  warning_notice_delete_seconds: "90",
  forward_warning_delete_seconds: "120",
  spam_notice_delete_seconds: "45",
  bio_link_notice_delete_seconds: "60",
};
const ADVANCED_FIELD_KEYS = new Set(["id", "created_at", "updated_at", "settings"]);
const GROUP_TAB_ORDER = ["Thông tin", "Bảo vệ group", "Luật spam", "Tin bot gửi", "Lịch gửi", "Video", "Menu riêng", "Nội dung riêng", "Ghi chú", "Kỹ thuật"];
const GROUP_BASE_SECTIONS = new Set(["Thông tin nhóm", "Thông tin", "Ghi chú", "Advanced"]);
const GROUP_MODULE_SECTIONS: Record<string, Set<string>> = {
  moderation: new Set(["Thông tin nhóm", "Thông tin", "Kiểm duyệt", "Chống spam", "Mẫu tin kiểm duyệt", "Ghi chú", "Advanced"]),
  automation: new Set(["Thông tin nhóm", "Thông tin", "Lịch gửi tin", "Video", "Ghi chú", "Advanced"]),
  menu_policy: new Set(["Thông tin nhóm", "Thông tin", "Menu bot", "Nội dung", "Ghi chú", "Advanced"])
};
const GROUP_TAB_LABELS: Record<string, string> = {
  "Thông tin nhóm": "Thông tin",
  "Thông tin": "Thông tin",
  "Kiểm duyệt": "Bảo vệ group",
  "Chống spam": "Luật spam",
  "Mẫu tin kiểm duyệt": "Tin bot gửi",
  "Lịch gửi tin": "Lịch gửi",
  Video: "Video",
  "Menu bot": "Menu riêng",
  "Nội dung": "Nội dung riêng",
  "Ghi chú": "Ghi chú",
  Advanced: "Kỹ thuật"
};
const GROUP_PRESETS = [
  {
    key: "basic_spam",
    title: "Chống spam cơ bản",
    desc: "Warn khi spam, chặn forward/nút bấm và giữ admin được miễn trừ.",
    values: {
      spam_max_messages: 5,
      spam_window_seconds: 30,
      spam_action: "warn",
      delete_forwarded_messages: true,
      delete_inline_keyboard_messages: true,
      exempt_admins: true,
      enabled: true
    }
  },
  {
    key: "strict_links",
    title: "Chặn quảng cáo mạnh",
    desc: "Xóa forward, xóa bài có nút, chặn bot lạ và tăng mức xử lý spam.",
    values: {
      spam_max_messages: 3,
      spam_window_seconds: 20,
      spam_action: "ban",
      forward_action: "delete",
      inline_keyboard_action: "delete",
      delete_forwarded_messages: true,
      delete_inline_keyboard_messages: true,
      delete_messages_from_bots: true,
      remove_unknown_bots: true,
      enabled: true
    }
  },
  {
    key: "safe_mode",
    title: "Safe mode",
    desc: "Chỉ xóa/warn, tránh ban/kick tự động trong lúc thử nghiệm.",
    values: {
      spam_action: "warn",
      forward_action: "warn",
      inline_keyboard_action: "warn",
      ban_after_warnings: 5,
      remove_unknown_bots: false,
      exempt_admins: true,
      enabled: true
    }
  }
];
const SCHEDULE_STEPS = [
  { title: "Chọn group", desc: "Xác định group/kênh sẽ nhận tin định kỳ." },
  { title: "Chọn pool", desc: "Gán message_pool hoặc video_pool đang có nội dung." },
  { title: "Preview nội dung", desc: "Xem trước vài tin/video bot có thể gửi." },
  { title: "Đặt giờ", desc: "Lưu daily/video window trên cấu hình group." }
];
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
    desc: "Quản lý module giống plugin: bật module nào thì module đó mới xuất hiện trên sidebar.",
    icon: Sparkles,
    tone: "content",
    tables: ["module_settings"]
  },
  {
    key: "logs",
    title: "Nhật ký",
    shortTitle: "Nhật ký",
    desc: "Ai ban member, ai xóa tin, ai sửa quyền và các sự kiện vận hành cần rà soát.",
    icon: Activity,
    tone: "main",
    tables: ["audit_logs"]
  },
  {
    key: "settings",
    title: "Cài đặt hệ thống",
    shortTitle: "Cài đặt hệ thống",
    desc: "Chỉ còn các key dùng chung thật sự. Phần lớn cài đặt đã chuyển vào module hoặc override theo group.",
    icon: SlidersHorizontal,
    tone: "content",
    tables: ["config"]
  }
];
const TABLE_GUIDES: Record<string, { title: string; body: string; steps: string[] }> = {
  groups: {
    title: "Group trong kiểm duyệt",
    body: "Group là nơi bot áp dụng luật kiểm duyệt, chống spam, xóa tin vi phạm và quyền xử lý thành viên.",
    steps: ["Set đúng Group ID", "Bật các công tắc kiểm duyệt cần dùng", "Kiểm tra bot có quyền xóa tin, mute hoặc ban"]
  },
  messages: {
    title: "Cách dùng Tin nhắn",
    body: "Tin trong cùng một Nhóm nội dung sẽ được bot chọn ngẫu nhiên theo Độ ưu tiên.",
    steps: ["Paste mỗi dòng một tin", "Đặt Nhóm nội dung mặc định khi nhập nhanh", "Vào Nhóm và set message_pool trùng tên"]
  },
  scheduled_posts: {
    title: "Cách dùng Gửi tin hẹn giờ",
    body: "Đây là flow quyết định bot nào gửi nội dung nào vào group nào và vào lúc mấy giờ.",
    steps: ["Chọn Bot và Group/Kênh trước", "Nhập nội dung cần gửi", "Đặt giờ dạng daily 09:00 rồi bật lịch"]
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
    title: "Cài đặt hệ thống",
    body: "Chỉ quản lý các cấu hình dùng chung toàn bot/CP. Cài đặt module nằm ngay trong module tương ứng để tránh trùng chỗ.",
    steps: ["Global ở Cài đặt hệ thống", "Module ở trang module", "Group override ở flow của module"]
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
  spam_max_messages: "Số tin spam tối đa",
  spam_window_seconds: "Khung thời gian spam",
  spam_action: "Cách xử lý spam",
  spam_restrict_seconds: "Thời gian mute khi spam",
  forward_action: "Cách xử lý forward",
  inline_keyboard_action: "Cách xử lý bài có nút bấm",
  ban_after_warnings: "Ban sau số cảnh báo",
  ban_seconds: "Thời gian ban",
  warning_text: "Mẫu cảnh báo chung",
  forward_warning_reason: "Lý do cảnh báo forward",
  forward_warning_text: "Mẫu cảnh báo forward",
  spam_restrict_text: "Mẫu tin khi mute tạm",
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
    keys: ["spam_max_messages", "spam_window_seconds", "spam_action", "spam_restrict_seconds", "forward_action", "inline_keyboard_action", "ban_after_warnings", "ban_seconds", "duplicate_message_enabled", "duplicate_message_max_count", "duplicate_message_window_seconds", "duplicate_message_action", "duplicate_message_reason", "violation_delete_retry_seconds"]
  },
  {
    title: "Mẫu tin kiểm duyệt",
    desc: "Các tin bot gửi ra khi cảnh báo spam, forward, mute tạm hoặc phát hiện bio có link.",
    icon: MessageSquare,
    tone: "content",
    keys: ["warning_text", "forward_warning_reason", "forward_warning_text", "spam_restrict_text", "warning_notice_delete_seconds", "forward_warning_delete_seconds", "spam_notice_delete_seconds", "bio_link_warning_text", "bio_link_notice_delete_seconds"]
  },
  {
    title: "Bio, link & cảnh báo",
    desc: "Quét link trong bio, xóa tin vi phạm và nội dung cảnh báo.",
    icon: Archive,
    tone: "scam",
    keys: ["scan_bio_links", "bio_link_delete_message", "bio_link_restrict_seconds", "bio_scan_cache_seconds"]
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
    title: "Kiểm duyệt tự động",
    desc: "Chống spam, quảng cáo, ban, xóa tin hệ thống, quét bio link và link xấu.",
    icon: ShieldCheck,
    tone: "security",
    tables: ["groups", "keywords", "domain_blacklist", "link_shorteners", "bot_allowlist", "config"],
    configKeys: ["delete_system_messages", "delete_forwarded_messages", "delete_inline_keyboard_messages", "delete_messages_from_bots", "remove_unknown_bots", "exempt_admins", "spam_max_messages", "spam_window_seconds", "spam_action", "spam_restrict_seconds", "forward_action", "inline_keyboard_action", "ban_after_warnings", "ban_seconds", "warning_text", "forward_warning_reason", "forward_warning_text", "spam_restrict_text", "warning_notice_delete_seconds", "forward_warning_delete_seconds", "spam_notice_delete_seconds", "violation_delete_retry_seconds", "duplicate_message_enabled", "duplicate_message_max_count", "duplicate_message_window_seconds", "duplicate_message_action", "duplicate_message_reason", "scan_bio_links", "bio_link_delete_message", "bio_link_restrict_seconds", "bio_scan_cache_seconds", "bio_link_warning_text", "bio_link_notice_delete_seconds"]
  },
  {
    key: "menu_policy",
    moduleKeys: ["menu_policy"],
    title: "Menu & nội quy",
    desc: "Menu lệnh Telegram, nút Quy định, nội quy nhóm và nội dung /start.",
    icon: MessageSquare,
    tone: "content",
    tables: ["config"],
    configKeys: ["policy_text", "show_policy_button", "policy_button_text", "bot_menu_commands", "help_menu_commands", "start_fallback_text", "help_menu_title"]
  },
  {
    key: "verification",
    moduleKeys: ["verification"],
    title: "Bảo mật & verify",
    desc: "Captcha, chào thành viên mới, tự kick member chưa xác minh và bot được phép.",
    icon: Bot,
    tone: "main",
    tables: ["verification_settings", "captcha_questions", "bot_allowlist", "config"],
    configKeys: ["captcha_text", "captcha_success_text", "captcha_failed_text", "captcha_message_delete_seconds", "verify_success_delete_seconds"]
  },
  {
    key: "automation",
    moduleKeys: ["scheduled_posts"],
    title: "Tự động hóa",
    desc: "Gửi tin hẹn giờ, video và nhóm nội dung dùng chung.",
    icon: Sparkles,
    tone: "content",
    tables: ["groups", "messages", "video_messages", "config"],
    configKeys: ["send_on_boot", "send_if_silent"]
  },
  {
    key: "auto_reply",
    moduleKeys: ["auto_reply"],
    title: "Auto reply",
    desc: "Câu kích hoạt, nội dung trả lời tự động và kiểu khớp.",
    icon: MessageSquare,
    tone: "fun",
    tables: ["auto_replies"]
  },
  {
    key: "anti_scam",
    moduleKeys: ["anti_scam"],
    title: "Chống scam",
    desc: "Dữ liệu scam, báo cáo riêng, channel duyệt và tra cứu /check.",
    icon: Archive,
    tone: "scam",
    tables: ["scam_entities", "scam_reports", "config"],
    configKeys: ["scam_review_channel_id", "admin_only_text", "check_usage_text", "check_not_found_text", "check_result_title", "report_usage_text", "report_received_text", "addscam_usage_text", "addscam_success_text", "scam_review_channel_text", "scam_report_pending_text", "scam_report_confirmed_text", "scam_check_safe_text", "scam_check_found_text"]
  },
  {
    key: "entertainment",
    moduleKeys: ["entertainment", "giveaway"],
    title: "Giải trí",
    desc: "Giveaway, quay số, event, điểm tương tác và bảng xếp hạng.",
    icon: Gift,
    tone: "fun",
    tables: ["giveaway_campaigns", "giveaway_entries", "entertainment_events", "reputation_rules", "config"],
    configKeys: ["giveaway_created_text", "giveaway_empty_text", "giveaway_list_title", "giveaway_join_usage_text", "giveaway_not_found_open_text", "giveaway_keyword_required_text", "giveaway_joined_text", "giveaway_join_duplicate_text", "giveaway_draw_usage_text", "giveaway_not_found_text", "giveaway_no_entries_text", "giveaway_result_text", "giveaway_close_usage_text", "giveaway_closed_text"]
  },
  {
    key: "analytics",
    moduleKeys: ["analytics"],
    title: "Thống kê",
    desc: "Dashboard, nhật ký hoạt động và sức khỏe vận hành.",
    icon: BarChart3,
    tone: "main",
    tables: ["bot_metrics", "audit_logs"]
  },
  {
    key: "members",
    moduleKeys: ["members"],
    title: "Thành viên",
    desc: "Phân quyền admin, role member, VIP, restricted và điểm tương tác.",
    icon: Users,
    tone: "security",
    tables: ["admins", "member_roles", "reputation_rules", "giveaway_entries"]
  }
];
const MODULE_TABLE_OWNER: Record<string, string> = {
  keywords: "moderation",
  domain_blacklist: "moderation",
  link_shorteners: "moderation",
  bot_allowlist: "moderation",
  verification_settings: "verification",
  captcha_questions: "verification",
  scheduled_posts: "automation",
  messages: "automation",
  video_messages: "automation",
  auto_replies: "auto_reply",
  scam_entities: "anti_scam",
  scam_reports: "anti_scam",
  giveaway_campaigns: "entertainment",
  giveaway_entries: "entertainment",
  entertainment_events: "entertainment",
  reputation_rules: "entertainment",
  bot_metrics: "analytics",
  audit_logs: "analytics",
  admins: "members",
  member_roles: "members"
};
const MODULE_CONFIG_KEYS = new Set(MODULE_HUBS.flatMap((module) => module.configKeys || []));
const SYSTEM_CONFIG_SECTIONS = [
  {
    title: "Cài đặt dùng chung",
    desc: "Chỉ hiện các key thật sự chia sẻ toàn bot. Nếu một field cần chỉnh theo module hoặc theo group, nó sẽ không nằm ở đây.",
    icon: SlidersHorizontal,
    tone: "main",
    keys: [] as string[]
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
  spam_max_messages: "Bao nhiêu tin nhắn trong một khung thời gian sẽ bị coi là spam.",
  spam_window_seconds: "Khung thời gian để đếm spam. Ví dụ 15 nghĩa là 15 giây.",
  spam_action: "Hành động mặc định khi user spam: warn để cảnh báo, mute để khóa chat tạm, ban để chặn khỏi nhóm.",
  spam_restrict_seconds: "Số giây mute/restrict user khi spam. Ví dụ 300 là 5 phút.",
  forward_action: "Hành động khi user forward nội dung vào group. Nên dùng warn hoặc delete trước khi siết lên ban.",
  inline_keyboard_action: "Hành động khi user gửi bài có nút bấm inline đáng ngờ.",
  ban_after_warnings: "Bao nhiêu lần cảnh báo thì nâng lên ban tự động.",
  ban_seconds: "Số giây ban user. Đặt 0 nghĩa là ban vĩnh viễn.",
  warning_text: "Tin bot gửi khi user bị cảnh báo chung. Có thể dùng {mention}, {reason}, {count}, {limit}.",
  forward_warning_reason: "Lý do nội bộ gắn vào cảnh báo forward và nhật ký audit.",
  forward_warning_text: "Tin bot gửi khi user bị cảnh báo vì forward. Có thể dùng {mention}, {reason}, {count}, {limit}.",
  spam_restrict_text: "Tin bot gửi khi user bị mute/restrict tạm thời. Có thể dùng {mention}, {reason}, {user_id}.",
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
  if (table.key === "audit_logs") {
    const labels: Record<string, string> = {
      delete_message: "Đã xóa tin nhắn",
      ban: "Đã ban thành viên",
      kick: "Đã kick thành viên",
      mute: "Đã mute thành viên",
      warn: "Đã cảnh báo thành viên",
      role_update: "Đã đổi quyền",
      title_update: "Đã đổi tiêu đề",
      module_update: "Đã đổi trạng thái module",
      scam_report_confirmed: "Đã xác nhận báo cáo scam",
      scam_report_rejected: "Đã từ chối báo cáo scam"
    };
    const action = String(row.action || "");
    return labels[action.toLowerCase()] || action.replaceAll("_", " ") || `Nhật ký #${row.id}`;
  }
  if (table.key === "scam_reports") {
    return row.target_username || row.bank_account || row.phone || row.target_uid || `Report #${row.id}`;
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
  const key = String(row.key || "");
  if (CONFIG_BOOLEAN_KEYS.has(key)) {
    return true;
  }
  const value = String(row.value ?? "").trim().toLowerCase();
  return ["true", "false"].includes(value);
}

function materializeConfigRows(rows: Row[], expectedKeys: string[], botKey: string) {
  const rowMap = new Map<string, Row>();
  for (const row of rows) {
    rowMap.set(String(row.key || ""), row);
  }
  const virtualRows = expectedKeys.map((key) => rowMap.get(key) || {
    id: `virtual:${botKey}:${key}`,
    bot_key: botKey,
    key,
    value: CONFIG_DEFAULT_VALUES[key] ?? "",
    enabled: true,
    notes: "Mặc định gợi ý. Bấm Lưu để tạo cấu hình thật.",
    __virtual: true
  });
  const extras = rows.filter((row) => !expectedKeys.includes(String(row.key || "")));
  return [...virtualRows, ...extras];
}

function isVirtualConfigRow(row: Row) {
  return String(row.id || "").startsWith("virtual:");
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

function configPlaceholders(key: string) {
  if (["warning_text", "forward_warning_text", "spam_restrict_text", "bio_link_warning_text"].includes(key)) {
    return ["{mention}", "{reason}", "{count}", "{limit}", "{user_id}"];
  }
  return [];
}

function configFieldHint(key: string) {
  if (["forward_warning_reason", "duplicate_message_reason"].includes(key)) {
    return "Đây là lý do cố định, không cần placeholder.";
  }
  return "";
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

function formatDateTime(value: unknown) {
  if (!value) {
    return "Chưa có thời gian";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function parseDetails(value: unknown) {
  if (!value) {
    return {};
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return { raw: String(value) };
  }
}

function auditLegacyReason(value: unknown) {
  const raw = String(value || "");
  if (!raw) {
    return "";
  }
  if (raw === "bio_link") {
    return "Bio có link Telegram";
  }
  if (raw === "forwarded_message") {
    return "Tin nhắn được forward";
  }
  if (raw === "inline_keyboard") {
    return "Tin nhắn có nút bấm";
  }
  if (raw === "duplicate_message") {
    return "Tin nhắn trùng lặp nhiều lần";
  }
  if (raw === "spam") {
    return "Spam quá ngưỡng";
  }
  if (raw.startsWith("keyword:")) {
    const [, keyword, action] = raw.match(/^keyword:(.*):before_(.*)$/) || [];
    return keyword ? `Từ khóa cấm: ${keyword}${action ? `, xử lý: ${action}` : ""}` : raw;
  }
  if (raw.startsWith("domain:")) {
    const [, domain, action] = raw.match(/^domain:(.*):before_(.*)$/) || [];
    return domain ? `Domain bị chặn: ${domain}${action ? `, xử lý: ${action}` : ""}` : raw;
  }
  if (raw.startsWith("shortener:")) {
    const [, domain, action] = raw.match(/^shortener:(.*):before_(.*)$/) || [];
    return domain ? `Link rút gọn bị chặn: ${domain}${action ? `, xử lý: ${action}` : ""}` : raw;
  }
  if (raw.startsWith("seconds=")) {
    return `Thời lượng: ${raw.replace("seconds=", "")} giây`;
  }
  return raw;
}

function isAutomaticAudit(row: Row) {
  return ["delete_message", "ban", "kick", "warn", "restrict", "verify_success"].includes(String(row.action || "").toLowerCase());
}

function auditActor(row: Row, details: Record<string, unknown>) {
  const actor = row.actor_user_id || details.actor_user_id || details.actor_username;
  if (actor) {
    return displayValue(actor);
  }
  return isAutomaticAudit(row) ? "Bot tự động" : "Chưa đặt";
}

function auditReason(row: Row, details: Record<string, unknown>) {
  return displayValue(details.reason || details.trigger_reason || auditLegacyReason(details.raw || row.details));
}

function auditDeletedContent(row: Row, details: Record<string, unknown>) {
  return displayValue(details.deleted_text || details.message || details.text || details.content || (row.action === "delete_message" ? "" : details.raw || row.details));
}

function auditLogSpecificRows(row: Row, details: Record<string, unknown>) {
  const rows: { label: string; value: string }[] = [];
  if (details.deleted_text || details.message || details.text || details.content) {
    rows.push({ label: "Tin đã xóa", value: auditDeletedContent(row, details) });
  }
  if (details.bio_link) {
    rows.push({ label: "Bio link", value: displayValue(details.bio_link) });
  }
  if (details.bio_text) {
    rows.push({ label: "Bio hiện tại", value: displayValue(details.bio_text) });
  }
  if (details.matched_keyword) {
    rows.push({ label: "Từ khóa", value: displayValue(details.matched_keyword) });
  }
  if (details.blocked_domain) {
    rows.push({ label: "Domain", value: displayValue(details.blocked_domain) });
  }
  if (details.rule_action) {
    rows.push({ label: "Luật xử lý", value: displayValue(details.rule_action) });
  }
  if (details.forward_from_chat_title || details.forward_from_chat_id || details.forward_sender_name || details.forward_from_username) {
    rows.push({
      label: "Nguồn forward",
      value: displayValue(details.forward_from_chat_title || details.forward_sender_name || details.forward_from_username || details.forward_from_chat_id)
    });
  }
  if (details.warning_count || details.warning_limit) {
    rows.push({ label: "Cảnh báo", value: `${displayValue(details.warning_count)}/${displayValue(details.warning_limit)}` });
  }
  return rows;
}

function auditLogRows(row: Row) {
  const details = parseDetails(row.details);
  const duration = details.duration || details.duration_seconds || details.until || details.restrict_seconds || details.ban_seconds || details.seconds;
  const baseRows = [
    { label: "Thời gian", value: formatDateTime(row.created_at || details.created_at) },
    { label: "Hành động", value: actionBadge(row, { key: "audit_logs", label: "Nhật ký", description: "", titleField: "action", summaryFields: [], fields: [] }) },
    { label: "Người thực hiện", value: auditActor(row, details) },
    { label: "Đối tượng", value: displayValue(row.target_user_id || details.target_user_id || details.target_username) },
    { label: "Group/Kênh", value: displayValue(row.chat_id || details.chat_id || details.group_id) },
    { label: "Thời lượng", value: duration ? configDisplayValue({ key: "duration_seconds", value: duration }) : "Không áp dụng" },
    { label: "Lý do", value: auditReason(row, details) }
  ];
  const specificRows = auditLogSpecificRows(row, details);
  return specificRows.length ? [...baseRows, ...specificRows] : [...baseRows, { label: "Chi tiết gốc", value: displayValue(details.raw || row.details) }];
}

function auditLogEssentials(row: Row) {
  const details = parseDetails(row.details);
  const specificRows = auditLogSpecificRows(row, details);
  const primaryDetail = specificRows.find((item) => ["Bio link", "Từ khóa", "Domain", "Tin đã xóa"].includes(item.label));
  return [
    { label: "Người thực hiện", value: auditActor(row, details) },
    { label: "Đối tượng", value: displayValue(row.target_user_id || details.target_user_id || details.target_username) },
    { label: "Lý do", value: auditReason(row, details) },
    primaryDetail || { label: "Group/Kênh", value: displayValue(row.chat_id || details.chat_id || details.group_id) }
  ];
}

function auditLogSeverity(row: Row) {
  const action = String(row.action || "").toLowerCase();
  if (["ban", "kick", "mute", "scam_report_confirmed"].includes(action)) {
    return "critical";
  }
  if (["delete_message", "warn", "scam_report_rejected"].includes(action)) {
    return "warning";
  }
  if (["module_update", "role_update", "title_update"].includes(action)) {
    return "info";
  }
  return "neutral";
}

function auditLogSummary(row: Row) {
  const details = auditLogRows(row);
  const time = details.find((item) => item.label === "Thời gian")?.value;
  const actor = details.find((item) => item.label === "Người thực hiện")?.value;
  const target = details.find((item) => item.label === "Đối tượng")?.value;
  return `${time} · ${actor} -> ${target}`;
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
  if (table.key === "scam_reports") {
    return scamReportSummary(row);
  }
  const key = table.titleField;
  const raw = row[key] || row.value || row.reason || row.notes || "";
  return String(raw).replace(/\s+/g, " ").trim();
}

function scamReportTarget(row: Row) {
  return row.target_username || row.bank_account || row.phone || row.target_uid || "Chưa rõ đối tượng";
}

function scamReportSummary(row: Row) {
  const reporter = row.reporter_username || row.reporter_user_id || "ẩn danh";
  const target = scamReportTarget(row);
  const evidence = String(row.evidence || "Chưa có bằng chứng").replace(/\s+/g, " ").trim();
  return `Người báo cáo: ${reporter} · Đối tượng: ${target} · Bằng chứng: ${evidence}`;
}

function scamReportFacts(row: Row) {
  return [
    { label: "Người báo cáo", value: displayValue(row.reporter_username || row.reporter_user_id) },
    { label: "Đối tượng", value: displayValue(scamReportTarget(row)) },
    { label: "Tài khoản", value: displayValue(row.bank_account) },
    { label: "Điện thoại", value: displayValue(row.phone) },
    { label: "Trạng thái", value: statusText(row) }
  ];
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

function healthState(row: Row) {
  if (row.enabled === false || row.status === "paused" || row.status === "closed" || row.status === "rejected") {
    return { className: "disabled", label: "Đang tắt" };
  }
  if (row.status === "pending" || row.status === "draft" || row.status === "watch") {
    return { className: "setup", label: "Cần setup" };
  }
  if (row.status === "error" || row.status === "danger") {
    return { className: "error", label: "Lỗi" };
  }
  return { className: "healthy", label: "Ổn định" };
}

function actionBadge(row: Row, table: TableConfig) {
  const action = row.action || row.risk_level || row.status || row.role || row.captcha_type || row.period || "";
  if (action) {
    if (table.key === "audit_logs") {
      const labels: Record<string, string> = {
        delete_message: "Xóa tin",
        ban: "Ban",
        kick: "Kick",
        mute: "Mute",
        warn: "Cảnh báo",
        role_update: "Đổi quyền",
        title_update: "Đổi tiêu đề",
        module_update: "Đổi module",
        scam_report_confirmed: "Xác nhận scam",
        scam_report_rejected: "Từ chối scam"
      };
      return labels[String(action).toLowerCase()] || String(action).replaceAll("_", " ");
    }
    return String(action).replaceAll("_", " ").toUpperCase();
  }
  if (table.key === "messages" || table.key === "video_messages") {
    return String(row.pool || "default").toUpperCase();
  }
  if (table.key === "bots") {
    return row.enabled === false ? "OFFLINE" : "ONLINE";
  }
  return statusText(row).toUpperCase();
}

function detailRows(row: Row, table: TableConfig) {
  const keys = Array.from(new Set([...table.summaryFields, "bot_key", "group_id", "chat_id", "match", "action", "reason", "status", "enabled"]));
  return keys
    .filter((key) => !fieldIsAdvanced(table.key, key) && row[key] !== undefined && row[key] !== null && row[key] !== "")
    .slice(0, 10)
    .map((key) => ({ key, label: fieldByKey(table, key)?.label || key.replaceAll("_", " "), value: displayValue(row[key]) }));
}

function advancedDetailRows(row: Row, table: TableConfig) {
  const keys = Array.from(new Set(["id", "created_at", "updated_at", "settings", "key", ...Object.keys(row)]));
  return keys
    .filter((key) => fieldIsAdvanced(table.key, key) && row[key] !== undefined && row[key] !== null && row[key] !== "")
    .slice(0, 12)
    .map((key) => ({ key, label: fieldByKey(table, key)?.label || key.replaceAll("_", " "), value: displayValue(row[key]) }));
}

function fieldIsAdvanced(tableKey: string, fieldKey: string) {
  if (ADVANCED_FIELD_KEYS.has(fieldKey)) {
    return true;
  }
  if (tableKey === "config" && fieldKey === "key") {
    return true;
  }
  return false;
}

function rowMatchesQuickFilter(row: Row, filter: string) {
  if (!filter) {
    return true;
  }
  if (filter === "active") {
    return row.enabled !== false && row.status !== "paused" && row.status !== "closed";
  }
  if (filter === "disabled") {
    return row.enabled === false || row.status === "paused" || row.status === "closed";
  }
  return [row.action, row.match, row.status, row.role, row.risk_level].map((value) => String(value || "").toLowerCase()).includes(filter);
}

function tableHasField(table: TableConfig | undefined, fieldKey: string) {
  return Boolean(table?.fields.some((field) => field.key === fieldKey));
}

function tableSupportsScope(table: TableConfig | undefined, scope: "bot" | "group") {
  if (scope === "bot") {
    return tableHasField(table, "bot_key");
  }
  return tableHasField(table, "group_id") || tableHasField(table, "chat_id");
}

function buildScopedQuery(table: TableConfig, searchText: string, selectedBot: string, selectedGroup: string) {
  const params = new URLSearchParams();
  if (searchText.trim()) {
    params.set("search", searchText.trim());
  }
  if (selectedBot && tableSupportsScope(table, "bot")) {
    params.set("bot_key", selectedBot);
  }
  if (selectedGroup && tableSupportsScope(table, "group")) {
    params.set("group_id", selectedGroup);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function normalizedText(value: unknown) {
  return String(value || "").toLowerCase();
}

function safeRegexMatch(pattern: unknown, text: string) {
  try {
    return new RegExp(String(pattern), "i").test(text);
  } catch {
    return false;
  }
}

function rowMatchesRule(row: Row, text: string, key: string) {
  const source = String(row[key] || "").trim();
  const matchMode = String(row.match || "contains").toLowerCase();
  if (!source || !text) {
    return false;
  }
  if (matchMode === "regex") {
    return safeRegexMatch(source, text);
  }
  if (matchMode === "exact") {
    return normalizedText(text).trim() === normalizedText(source).trim();
  }
  return normalizedText(text).includes(normalizedText(source));
}

function extractDomains(text: string) {
  return Array.from(text.matchAll(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi))
    .map((match) => match[1].toLowerCase());
}

function testRowsForTable(tableKey: string, rows: Row[], text: string): RuleTestResult[] {
  const value = text.trim();
  if (!value) {
    return [];
  }
  if (tableKey === "keywords") {
    return rows
      .filter((row) => row.enabled !== false && rowMatchesRule(row, value, "keyword"))
      .map((row) => ({ label: String(row.keyword), detail: `${row.match || "contains"} -> ${row.action || "delete"}`, matched: true }));
  }
  if (tableKey === "auto_replies") {
    return rows
      .filter((row) => row.enabled !== false && rowMatchesRule(row, value, "trigger"))
      .map((row) => ({ label: String(row.trigger), detail: String(row.reply || "Chưa có nội dung trả lời"), matched: true }));
  }
  if (tableKey === "domain_blacklist" || tableKey === "link_shorteners") {
    const domains = extractDomains(value);
    return rows
      .filter((row) => {
        const domain = String(row.domain || "").toLowerCase();
        return row.enabled !== false && domain && domains.some((item) => item === domain || item.endsWith(`.${domain}`));
      })
      .map((row) => ({ label: String(row.domain), detail: `${row.risk || "shortener"} -> ${row.action || "warn"}`, matched: true }));
  }
  return [];
}

function cockpitMetrics(row: Row, table: TableConfig) {
  const action = actionBadge(row, table);
  const health = healthState(row).label;
  const scope = row.group_id || row.chat_id || row.bot_key || "Toàn hệ thống";
  return [
    { label: "Sức khỏe", value: health },
    { label: "Hành động", value: action },
    { label: "Phạm vi", value: String(scope) }
  ];
}

function cockpitActivity(row: Row, table: TableConfig) {
  const title = titleFor(row, table);
  const action = actionBadge(row, table).toLowerCase();
  return [
    `${title} đã được tải từ Supabase`,
    `Chính sách ${action} đã sẵn sàng đồng bộ runtime`,
    `Đã kiểm tra phạm vi ${row.group_id || row.chat_id || row.bot_key || "global"}`
  ];
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
  if (tableKey === "scheduled_posts") {
    return {
      title: "Flow gửi tin hẹn giờ",
      body: "Để gửi chào buổi sáng lúc 09:00: bật module Tự động hóa, bấm Tạo lịch gửi tin, nhập nội dung và lưu.",
      icon: SlidersHorizontal,
      chips: [
        { label: "Lịch đang bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Group có lịch", value: uniqueValues(rows, "chat_id").length },
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

function emptyStateFor(tableKey: string): EmptyStateConfig {
  const states: Record<string, EmptyStateConfig> = {
    messages: {
      title: "Chưa có kho tin nhắn",
      body: "Tạo nhóm nội dung đầu tiên, paste nhiều dòng rồi chọn group sẽ dùng pool này.",
      action: "Tạo tin nhắn",
      steps: ["Bấm Nhập nhanh", "Paste mỗi dòng một tin", "Đặt cùng Nhóm nội dung để group dùng pool này"]
    },
    video_messages: {
      title: "Chưa có kho video",
      body: "Bắt đầu bằng một video source, sau đó bật random mode và chọn group output.",
      action: "Tạo video source",
      steps: ["Lấy source chat ID", "Nhập message ID của video", "Gán Nhóm video cho group"]
    },
    keywords: {
      title: "Chưa có rule từ khóa",
      body: "Áp dụng preset chống scam hoặc paste danh sách từ khóa để bot tự xóa/warn tin vi phạm.",
      action: "Tạo rule đầu tiên",
      steps: ["Chọn hành động mặc định", "Paste keyword hàng loạt", "Dùng Test nhanh để kiểm tra rule"]
    },
    auto_replies: {
      title: "Chưa có auto reply",
      body: "Tạo trigger như giá, support, rule để bot trả lời tự động trong group hoặc inbox.",
      action: "Tạo auto reply",
      steps: ["Nhập câu kích hoạt", "Nhập nội dung trả lời", "Test câu hỏi mẫu trước khi bật"]
    },
    scheduled_posts: {
      title: "Chưa có lịch gửi tin",
      body: "Tạo automation đăng bài định kỳ, chọn pool nội dung và giờ chạy.",
      action: "Tạo lịch gửi tin",
      steps: ["Mở flow đúng từ Group", "Chọn message/video pool", "Đặt giờ bắt đầu và kết thúc"]
    },
    bots: {
      title: "Chưa có bot",
      body: "Thêm token bot trước, sau đó nối group và bật module cần vận hành.",
      action: "Thêm bot",
      steps: ["Nhập bot_key và token", "Đặt trạng thái active", "Sau khi lưu, nối group cho bot"]
    },
    groups: {
      title: "Chưa có group/kênh",
      body: "Thêm group ID, kiểm tra quyền admin rồi bật module cho phạm vi này.",
      action: "Thêm group",
      steps: ["Nhập Group ID dạng -100...", "Bật group", "Kiểm tra bot có quyền xóa tin/ban/mute"]
    }
  };
  return states[tableKey] || {
    title: "Chưa có mục vận hành nào",
    body: "Bắt đầu bằng preset khuyên dùng hoặc tạo mục điều khiển đầu tiên cho phạm vi này.",
    action: "Tạo mục đầu tiên",
    steps: ["Bấm Thêm", "Điền các trường chính", "Chỉ mở Advanced khi cần sửa dữ liệu kỹ thuật"]
  };
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

function sortGroupFieldGroups(groups: [string, FieldConfig[]][]) {
  return [...groups].sort(([left], [right]) => {
    const leftIndex = GROUP_TAB_ORDER.indexOf(left);
    const rightIndex = GROUP_TAB_ORDER.indexOf(right);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });
}

function groupTabLabel(section: string) {
  return GROUP_TAB_LABELS[section] || section;
}

function allowedGroupSectionsForLayer(activeLayer: string) {
  if (!activeLayer.startsWith("module:")) {
    return GROUP_BASE_SECTIONS;
  }
  const moduleKey = activeLayer.replace("module:", "");
  return GROUP_MODULE_SECTIONS[moduleKey] || GROUP_BASE_SECTIONS;
}

function dangerousGroupChanges(values: Row) {
  const issues: string[] = [];
  if (values.enabled === false) {
    issues.push("Group đang bị tắt, bot sẽ không áp dụng bảo vệ cho group này.");
  }
  if (["ban", "kick"].includes(String(values.spam_action || ""))) {
    issues.push("Spam action đang đặt mức xử lý mạnh.");
  }
  if (["ban", "kick"].includes(String(values.forward_action || ""))) {
    issues.push("Forward action đang đặt mức xử lý mạnh.");
  }
  if (["ban", "kick"].includes(String(values.inline_keyboard_action || ""))) {
    issues.push("Inline keyboard action đang đặt mức xử lý mạnh.");
  }
  if (values.remove_unknown_bots === true) {
    issues.push("Tự kick bot lạ đang bật.");
  }
  return issues;
}

function poolRows(rows: Row[], pool: string) {
  const targetPool = String(pool || "").trim();
  if (!targetPool) {
    return [];
  }
  return rows.filter((row) => row.enabled !== false && String(row.pool || "").trim() === targetPool);
}

function uniquePoolCounts(rows: Row[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const pool = String(row.pool || "").trim();
    if (!pool || row.enabled === false) {
      continue;
    }
    counts.set(pool, (counts.get(pool) || 0) + 1);
  }
  return counts;
}

function poolPreviewText(row: Row, type: "message" | "video") {
  if (type === "video") {
    const source = [row.from_chat_id, row.message_id].filter(Boolean).join(" / ");
    return row.caption || source || "Video chưa có caption/source rõ ràng";
  }
  return row.message || row.text || row.content || "Tin nhắn chưa có nội dung";
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
  const [scanMode, setScanMode] = useState<"scan" | "detail">("scan");
  const [workMode, setWorkMode] = useState<WorkMode>("overview");
  const [quickFilter, setQuickFilter] = useState("");
  const [quickTestInput, setQuickTestInput] = useState("");
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [activeGroupTab, setActiveGroupTab] = useState("Thông tin");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [lookups, setLookups] = useState<Lookups>({ bots: [], groups: [], messages: [], videos: [], moduleSettings: [], scamReports: [] });

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
  const messagePools = useMemo(() => uniqueValues(lookups.messages, "pool"), [lookups.messages]);
  const videoPools = useMemo(() => uniqueValues(lookups.videos, "pool"), [lookups.videos]);
  const messagePoolCounts = useMemo(() => uniquePoolCounts(lookups.messages), [lookups.messages]);
  const videoPoolCounts = useMemo(() => uniquePoolCounts(lookups.videos), [lookups.videos]);
  const activeGuide = useMemo(() => {
    if (activeLayer === "module:automation" && table?.key === "groups") {
      return {
        title: "Cách dùng random tin hẹn giờ",
        body: "Runtime hiện tại gửi random theo Nhóm nội dung trong bảng Tin nhắn. Chọn đúng pool tại đây để bot lấy ngẫu nhiên mỗi ngày.",
        steps: ["Tạo nhiều Tin nhắn cùng một Nhóm nội dung", "Vào group này và chọn Nhóm nội dung đó", "Đặt Bắt đầu và Kết thúc cùng giờ nếu muốn gửi đúng một thời điểm"]
      };
    }
    return table ? TABLE_GUIDES[table.key] : undefined;
  }, [activeLayer, table]);
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
    if (!rowMatchesQuickFilter(row, quickFilter)) {
      return false;
    }
    return true;
  }), [rows, selectedBot, selectedGroup, table?.key, quickFilter]);
  const selectedVisibleRows = useMemo(() => visibleRows.filter((row) => selectedIds.has(String(row.id))), [visibleRows, selectedIds]);
  const workflow = useMemo(() => workflowFor(activeKey, visibleRows, selectedVisibleRows.length), [activeKey, visibleRows, selectedVisibleRows.length]);
  const WorkflowIcon = workflow?.icon;
  const selectedGroupRow = useMemo(() => {
    if (!selectedGroup) {
      return null;
    }
    return lookups.groups.find((group) => String(group.group_id || group.chat_id || "") === selectedGroup) || null;
  }, [lookups.groups, selectedGroup]);
  const ruleTestResults = useMemo(() => testRowsForTable(table?.key || "", visibleRows, quickTestInput), [quickTestInput, table?.key, visibleRows]);
  const showRuleTester = Boolean(table && ["keywords", "auto_replies", "domain_blacklist", "link_shorteners"].includes(table.key));
  const scamInboxStats = useMemo(() => {
    const sourceRows = table?.key === "scam_reports" ? rows : [];
    return {
      pending: sourceRows.filter((row) => String(row.status || "pending") === "pending").length,
      confirmed: sourceRows.filter((row) => row.status === "confirmed").length,
      rejected: sourceRows.filter((row) => row.status === "rejected").length
    };
  }, [rows, table?.key]);
  const pendingScamReports = useMemo(
    () => lookups.scamReports.filter((row) => String(row.status || "pending") === "pending").length,
    [lookups.scamReports]
  );
  const auditStats = useMemo(() => {
    const sourceRows = table?.key === "audit_logs" ? rows : [];
    const critical = sourceRows.filter((row) => auditLogSeverity(row) === "critical").length;
    const warning = sourceRows.filter((row) => auditLogSeverity(row) === "warning").length;
    const latest = sourceRows[0];
    return {
      total: sourceRows.length,
      critical,
      warning,
      latestTime: latest ? formatDateTime(latest.created_at) : "Chưa có log"
    };
  }, [rows, table?.key]);
  const selectedGroupProtection = useMemo(() => {
    const row = selectedGroupRow || visibleRows.find((item) => table?.key === "groups" && String(item.group_id || item.chat_id || "") === selectedGroup) || null;
    if (!row) {
      return {
        ready: false,
        enabledChecks: 0,
        totalChecks: 6,
        warnings: ["Chưa chọn group cụ thể để đánh giá bảo vệ."]
      };
    }
    const checks = [
      row.enabled !== false,
      row.delete_forwarded_messages === true,
      row.delete_inline_keyboard_messages === true,
      row.delete_messages_from_bots === true || row.remove_unknown_bots === true,
      Boolean(row.spam_action),
      Boolean(row.spam_max_messages && row.spam_window_seconds)
    ];
    const warnings = [
      row.enabled === false ? "Group đang tắt protection." : "",
      !row.spam_action ? "Chưa đặt spam action." : "",
      row.remove_unknown_bots === true ? "Tự kick bot lạ đang bật, cần kiểm tra allowlist." : ""
    ].filter(Boolean);
    return {
      ready: checks.every(Boolean),
      enabledChecks: checks.filter(Boolean).length,
      totalChecks: checks.length,
      warnings
    };
  }, [selectedGroup, selectedGroupRow, table?.key, visibleRows]);
  const scheduleSubject = useMemo(() => {
    if (table?.key === "groups" && Object.keys(draft).length) {
      return draft;
    }
    return selectedGroupRow || (table?.key === "groups" ? visibleRows[0] : null) || {};
  }, [draft, selectedGroupRow, table?.key, visibleRows]);
  const scheduleMessagePool = String(scheduleSubject.message_pool || messagePools[0] || "");
  const scheduleVideoPool = String(scheduleSubject.video_pool || videoPools[0] || "");
  const scheduleMessagePreview = useMemo(() => poolRows(lookups.messages, scheduleMessagePool), [lookups.messages, scheduleMessagePool]);
  const scheduleVideoPreview = useMemo(() => poolRows(lookups.videos, scheduleVideoPool), [lookups.videos, scheduleVideoPool]);
  const scheduleIssues = useMemo(() => [
    !lookups.groups.length ? "Chưa có group/kênh để đặt lịch." : "",
    !scheduleMessagePool ? "Chưa chọn message pool." : "",
    scheduleMessagePool && !scheduleMessagePreview.length ? `Pool tin nhắn "${scheduleMessagePool}" đang rỗng hoặc toàn mục tắt.` : "",
    scheduleSubject.video_enabled && scheduleVideoPool && !scheduleVideoPreview.length ? `Pool video "${scheduleVideoPool}" đang rỗng hoặc toàn mục tắt.` : "",
    scheduleSubject.daily_enabled === false ? "Gửi tin hằng ngày đang tắt trên group này." : ""
  ].filter(Boolean), [lookups.groups.length, scheduleMessagePool, scheduleMessagePreview.length, scheduleSubject.daily_enabled, scheduleSubject.video_enabled, scheduleVideoPool, scheduleVideoPreview.length]);
  const dashboardRows = useMemo(() => visibleRows.filter((row) => table?.key === "bot_metrics" && row.enabled !== false), [visibleRows, table?.key]);
  const configScopeModule = useMemo(() => {
    const moduleKey = activeLayer.startsWith("module:") ? activeLayer.replace("module:", "") : "";
    return MODULE_HUBS.find((module) => module.key === moduleKey);
  }, [activeLayer]);
  const scopedConfigRows = useMemo(() => {
    if (table?.key !== "config") {
      return visibleRows;
    }
    if (activeLayer === "settings") {
      return visibleRows.filter((row) => !MODULE_CONFIG_KEYS.has(String(row.key || "")));
    }
    if (configScopeModule?.configKeys?.length) {
      return materializeConfigRows(
        visibleRows.filter((row) => configScopeModule.configKeys?.includes(String(row.key || ""))),
        configScopeModule.configKeys,
        selectedBot || "main"
      );
    }
    return visibleRows;
  }, [activeLayer, configScopeModule, selectedBot, table?.key, visibleRows]);
  const configTabs = useMemo(() => {
    if (activeLayer === "settings") {
      return scopedConfigRows.length
        ? SYSTEM_CONFIG_SECTIONS.map((section) => ({ ...section, rows: scopedConfigRows }))
        : [];
    }
    const sections = CONFIG_SECTIONS;
    const usedKeys = new Set(sections.flatMap((section) => section.keys));
    const baseTabs = sections.map((section) => ({
      ...section,
      rows: scopedConfigRows.filter((row) => section.keys.includes(String(row.key || "")))
    }));
    const otherRows = scopedConfigRows.filter((row) => !usedKeys.has(String(row.key || "")));
    const tabs = baseTabs.filter((section) => section.rows.length);
    if (otherRows.length) {
      tabs.push({
        title: "Cài đặt khác",
        desc: "Các cài đặt nâng cao chưa thuộc nhóm chính.",
        icon: SlidersHorizontal,
        tone: "main",
        keys: [],
        rows: otherRows
      });
    }
    return tabs;
  }, [activeLayer, scopedConfigRows]);
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
  const moduleRows = useMemo(() => lookups.moduleSettings.filter((row) => !selectedBot || row.bot_key === selectedBot), [lookups.moduleSettings, selectedBot]);
  const setupChecklist = useMemo(() => [
    {
      label: "Env CP sẵn sàng",
      done: Boolean(meta?.envStatus?.supabaseUrl && meta?.envStatus?.serviceRoleKey && meta?.envStatus?.cpPassword),
      detail: meta?.envStatus ? `Supabase: ${meta.envStatus.supabaseUrl && meta.envStatus.serviceRoleKey ? "đủ" : "thiếu"} · CP password: ${meta.envStatus.cpPassword ? "có" : "thiếu"}` : "Chưa đọc được trạng thái env"
    },
    {
      label: "Bot đã bật",
      done: Boolean(currentBot && currentBot.enabled !== false && currentBot.status !== "paused"),
      detail: currentBot ? `${currentBot.name || currentBot.bot_key} đang ${currentBot.enabled === false || currentBot.status === "paused" ? "tắt/paused" : "sẵn sàng"}` : "Chưa chọn hoặc chưa có bot trong CP"
    },
    {
      label: "Có group trong phạm vi",
      done: Boolean(selectedGroupRow || lookups.groups.length),
      detail: selectedGroupRow ? String(selectedGroupRow.group_name || selectedGroup) : `${lookups.groups.length} group/kênh đã khai báo`
    },
    {
      label: "Module nền đã tạo",
      done: Boolean(moduleRows.length),
      detail: moduleRows.length ? `${moduleRows.length} module có cấu hình` : "Chưa có module_settings cho bot này"
    },
    {
      label: "Pool nội dung khả dụng",
      done: Boolean(messagePools.length || videoPools.length),
      detail: messagePools.length || videoPools.length ? `${messagePools.length} pool tin nhắn, ${videoPools.length} pool video` : "Chưa có pool message/video cho automation"
    },
    {
      label: "Scam inbox sạch",
      done: pendingScamReports === 0,
      detail: pendingScamReports ? `${pendingScamReports} report đang chờ duyệt` : "Không có report scam pending"
    }
  ], [currentBot, lookups.groups.length, messagePools.length, meta?.envStatus, moduleRows.length, pendingScamReports, selectedGroup, selectedGroupRow, videoPools.length]);
  const setupIssues = useMemo(() => setupChecklist.filter((item) => !item.done), [setupChecklist]);
  const moduleState = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of moduleRows) {
      map.set(String(row.module_key || ""), row);
    }
    return map;
  }, [moduleRows]);
  const moduleCards = useMemo(() => MODULE_HUBS.map((module) => {
    const keys = module.moduleKeys || [module.key];
    const states = keys.map((key) => moduleState.get(key)).filter(Boolean);
    const isOn = states.length ? states.some((row) => row?.enabled !== false) : true;
    return { ...module, isOn };
  }), [moduleState]);
  const enabledModuleCards = useMemo(() => moduleCards.filter((module) => module.isOn), [moduleCards]);
  const disabledModuleCards = useMemo(() => moduleCards.filter((module) => !module.isOn), [moduleCards]);
  const moduleEnabled = useMemo(() => {
    const keys = activeModuleHub.moduleKeys || [activeModuleHub.key];
    const states = keys.map((key) => moduleState.get(key)).filter(Boolean);
    if (!states.length) {
      return true;
    }
    return states.some((row) => row?.enabled !== false);
  }, [activeModuleHub, moduleState]);
  const moduleLayers = useMemo(() => enabledModuleCards.map((module) => ({
    key: `module:${module.key}`,
    title: module.title,
    shortTitle: module.title,
    desc: module.desc,
    icon: module.icon,
    tone: module.tone,
    tables: module.tables,
    moduleKey: module.key
  })), [enabledModuleCards]);
  const sidebarLayers = useMemo(() => [...SYSTEM_LAYERS, ...moduleLayers], [moduleLayers]);
  const activeLayerHub = useMemo(() => sidebarLayers.find((layer) => layer.key === activeLayer) || SYSTEM_LAYERS[0], [activeLayer, sidebarLayers]);
  const ActiveLayerIcon = activeLayerHub.icon;
  const layerTables = useMemo(() => activeLayerHub.tables
    .map((key) => meta?.tables.find((tableItem) => tableItem.key === key))
    .filter((item): item is TableConfig => Boolean(item)), [activeLayerHub, meta?.tables]);
  const healthSummary = useMemo(() => {
    const activeBots = lookups.bots.filter((bot) => bot.enabled !== false && bot.status !== "paused").length;
    const disabledBots = lookups.bots.filter((bot) => bot.enabled === false || bot.status === "paused").length;
    const scopedGroups = lookups.groups.filter((group) => !selectedBot || !group.bot_key || group.bot_key === selectedBot);
    const offModules = moduleRows.filter((row) => row.enabled === false).length;
    const groupsMissingMessagePool = scopedGroups.filter((group) => group.daily_enabled !== false && group.message_pool && !messagePoolCounts.has(String(group.message_pool))).length;
    const groupsMissingVideoPool = scopedGroups.filter((group) => group.video_enabled === true && group.video_pool && !videoPoolCounts.has(String(group.video_pool))).length;
    const envMissing = [
      meta?.envStatus && !meta.envStatus.supabaseUrl,
      meta?.envStatus && !meta.envStatus.serviceRoleKey,
      meta?.envStatus && !meta.envStatus.cpPassword
    ].filter(Boolean).length;
    const missingSetup = [
      scopedGroups.length === 0,
      moduleRows.length === 0,
      groupsMissingMessagePool > 0,
      groupsMissingVideoPool > 0,
      envMissing > 0
    ].filter(Boolean).length;
    return {
      activeBots,
      disabledBots,
      groups: scopedGroups.length,
      enabledModules: moduleRows.filter((row) => row.enabled !== false).length,
      offModules,
      pendingScamReports,
      groupsMissingMessagePool,
      groupsMissingVideoPool,
      envMissing,
      missingSetup,
      issues: disabledBots + missingSetup + pendingScamReports
    };
  }, [lookups.bots, lookups.groups, messagePoolCounts, meta?.envStatus, moduleRows, pendingScamReports, selectedBot, videoPoolCounts]);
  const commandInsights = useMemo<CommandInsight[]>(() => {
    const insights: CommandInsight[] = [];
    if (healthSummary.disabledBots) {
      insights.push({
        severity: "critical",
        title: `${healthSummary.disabledBots} bot đang offline`,
        body: "Một số bot đang tắt hoặc paused. Kiểm tra token, trạng thái và Render service.",
        impact: "Độ phủ runtime đang giảm. Một số nhóm có thể không được kiểm duyệt hoặc tự động hóa.",
        action: "Kiểm tra bot",
        targetLayer: "bot",
        targetTable: "bots"
      });
    }
    if (!healthSummary.groups) {
      insights.push({
        severity: "warning",
        title: "Chưa có group hoạt động",
        body: "Bot cần được nối group/kênh và có quyền admin trước khi module vận hành.",
        impact: "Hiện chưa có nhóm nào nằm trong phạm vi điều khiển của bot.",
        action: "Kết nối nhóm",
        targetLayer: "group",
        targetTable: "groups"
      });
    }
    if (healthSummary.missingSetup) {
      insights.push({
        severity: "info",
        title: `${healthSummary.missingSetup} bước setup còn thiếu`,
        body: "Hoàn tất env, group, tin nhắn/pool và module để hệ thống chạy ổn định hơn.",
        impact: "Automation có thể chưa chạy cho đến khi hoàn tất setup.",
        action: "Setup nhanh",
        targetLayer: "modules",
        targetTable: "module_settings"
      });
    }
    if (healthSummary.pendingScamReports) {
      insights.push({
        severity: "warning",
        title: `${healthSummary.pendingScamReports} report scam chờ duyệt`,
        body: "Có báo cáo scam pending cần admin xác nhận hoặc từ chối để dữ liệu tra cứu sạch hơn.",
        impact: "User có thể chưa được cảnh báo đúng nếu report hợp lệ chưa được xác nhận.",
        action: "Duyệt scam",
        targetLayer: "module:anti_scam",
        targetTable: "scam_reports"
      });
    }
    if (!insights.length) {
      insights.push({
        severity: "healthy",
        title: "Hệ thống ổn định",
        body: "Bot, group và module chính đang ở trạng thái ổn định. Theo dõi activity stream để phát hiện bất thường.",
        impact: "Độ phủ vận hành đang tốt trong phạm vi hiện tại.",
        action: "Xem hoạt động",
        targetLayer: "logs",
        targetTable: "audit_logs"
      });
    }
    return insights.slice(0, 3);
  }, [healthSummary]);
  const liveActivity = useMemo(() => [
    { severity: healthSummary.issues ? "warning" : "healthy", text: `${healthSummary.enabledModules} module đang hoạt động trên ${healthSummary.groups} nhóm` },
    { severity: "info", text: `${visibleRows.length} ${table?.label || "mục"} trong phạm vi hiện tại` },
    { severity: healthSummary.issues ? "critical" : "healthy", text: healthSummary.issues ? `${healthSummary.issues} vấn đề vận hành cần kiểm tra` : "Chưa phát hiện lỗi nghiêm trọng" },
    { severity: healthSummary.pendingScamReports ? "warning" : "info", text: healthSummary.pendingScamReports ? `${healthSummary.pendingScamReports} report scam đang chờ duyệt` : "Không có report scam pending trong scope" },
    { severity: "info", text: healthSummary.offModules ? `${healthSummary.offModules} module tùy chọn đang ẩn khỏi sidebar` : "Các module đã bật đang hiện trên sidebar" }
  ], [healthSummary, table?.label, visibleRows.length]);
  const quickFilters = useMemo(() => {
    if (table?.key === "audit_logs") {
      const actions = Array.from(new Set(rows.map((row) => String(row.action || "").toLowerCase()).filter(Boolean))).slice(0, 6);
      return [
        { key: "", label: "Tất cả" },
        ...actions.map((action) => ({ key: action, label: actionBadge({ action }, table) }))
      ];
    }
    if (table?.key === "scam_reports") {
      return [
        { key: "pending", label: `Chờ duyệt (${scamInboxStats.pending})` },
        { key: "", label: "Tất cả" },
        { key: "confirmed", label: `Đã xác nhận (${scamInboxStats.confirmed})` },
        { key: "rejected", label: `Từ chối (${scamInboxStats.rejected})` }
      ];
    }
    const base = [
      { key: "", label: "Tất cả" },
      { key: "active", label: "Đang chạy" },
      { key: "disabled", label: "Đang tắt" }
    ];
    const values = Array.from(new Set(rows.flatMap((row) => [row.action, row.match, row.status]).map((value) => String(value || "").toLowerCase()).filter(Boolean))).slice(0, 5);
    return [...base, ...values.map((value) => ({ key: value, label: value.toUpperCase() }))];
  }, [rows, scamInboxStats.confirmed, scamInboxStats.pending, scamInboxStats.rejected, table]);
  const commandItems = useMemo(() => [
    { title: "Khôi phục protection", hint: "Mở module đang tắt và khôi phục bảo vệ", action: () => goToInsight({ targetLayer: "modules", targetTable: "module_settings" }) },
    { title: "Kiểm tra quyền bot", hint: "Xem nhóm, quyền admin và bot được phép", action: () => goToInsight({ targetLayer: "group", targetTable: "groups" }) },
    { title: "Áp dụng preset chống scam", hint: "Mở workflow từ khóa và domain nguy hiểm", action: () => goToInsight({ targetLayer: "module:moderation", targetTable: "keywords" }) },
    { title: "Mở logs runtime", hint: "Kiểm tra nhật ký và hoạt động gần đây", action: () => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" }) },
    { title: "Tạo lịch gửi tin", hint: "Mở flow gửi tin hẹn giờ cho group", action: () => startScheduledMessageFlow() },
    { title: "Bật verify khẩn cấp", hint: "Mở captcha và kiểm soát xác minh", action: () => goToInsight({ targetLayer: "module:verification", targetTable: "verification_settings" }) },
    { title: "Tạo mục điều khiển mới", hint: `Tạo trong ${table?.label || "màn hình hiện tại"}`, action: () => startCreate() }
  ], [table?.label]);
  const operationTasks = useMemo(() => [
    {
      title: "Setup bot mới",
      desc: "Tạo bot, nối group, bật module nền và kiểm tra pool nội dung.",
      meta: setupIssues.length ? `${setupIssues.length} bước còn thiếu` : "Đủ điều kiện nền",
      icon: Bot,
      tone: setupIssues.length ? "warning" : "healthy",
      action: () => goToInsight({ targetLayer: "bot", targetTable: "bots" })
    },
    {
      title: "Bảo vệ group",
      desc: "Đi thẳng tới group, spam action, keyword, domain và bot allowlist.",
      meta: `${healthSummary.groups} group trong phạm vi`,
      icon: ShieldCheck,
      tone: healthSummary.groups ? "healthy" : "warning",
      action: () => startGroupProtectionFlow()
    },
    {
      title: "Gửi tin định kỳ",
      desc: "Chọn group, chọn pool tin nhắn/video và đặt giờ chạy đúng flow runtime.",
      meta: `${messagePools.length + videoPools.length} pool khả dụng`,
      icon: Sparkles,
      tone: messagePools.length || videoPools.length ? "healthy" : "warning",
      action: () => startScheduledMessageFlow()
    },
    {
      title: "Duyệt scam",
      desc: "Xem report pending, xác nhận để tạo dữ liệu scam hoặc từ chối report sai.",
      meta: scamInboxStats.pending ? `${scamInboxStats.pending} report chờ duyệt` : "Không có report pending",
      icon: Archive,
      tone: "scam",
      action: () => {
        goToInsight({ targetLayer: "module:anti_scam", targetTable: "scam_reports" });
        setQuickFilter("pending");
      }
    },
    {
      title: "Test luật",
      desc: "Mở keyword/auto reply/domain rồi paste nội dung để kiểm tra rule khớp.",
      meta: "Có test nhanh",
      icon: Activity,
      tone: "info",
      action: () => goToInsight({ targetLayer: "module:moderation", targetTable: "keywords" })
    },
    {
      title: "Xem nhật ký",
      desc: "Rà soát ban, warn, xóa tin, đổi module và các thao tác đáng chú ý.",
      meta: "Audit trail",
      icon: BarChart3,
      tone: "info",
      action: () => goToInsight({ targetLayer: "logs", targetTable: "audit_logs" })
    }
  ], [healthSummary.groups, messagePools.length, scamInboxStats.pending, setupIssues.length, videoPools.length]);
  const filteredCommandItems = useMemo(() => {
    const query = commandSearch.trim().toLowerCase();
    if (!query) {
      return commandItems;
    }
    return commandItems.filter((item) => `${item.title} ${item.hint}`.toLowerCase().includes(query));
  }, [commandItems, commandSearch]);

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
      throw new Error(payload.error || "Yêu cầu thất bại.");
    }
    return payload;
  }

  async function loadLookups() {
    try {
      const scopedBotQuery = selectedBot ? `?bot_key=${encodeURIComponent(selectedBot)}` : "";
      const [botsPayload, groupsPayload, messagesPayload, videosPayload, modulePayload, scamReportsPayload] = await Promise.all([
        api("/api/bots"),
        api(`/api/groups${scopedBotQuery}`),
        api(`/api/messages${scopedBotQuery}`),
        api(`/api/video_messages${scopedBotQuery}`),
        api(`/api/module_settings${scopedBotQuery}`),
        api(`/api/scam_reports${scopedBotQuery}`)
      ]);
      setLookups({
        bots: botsPayload.rows || [],
        groups: groupsPayload.rows || [],
        messages: messagesPayload.rows || [],
        videos: videosPayload.rows || [],
        moduleSettings: modulePayload.rows || [],
        scamReports: scamReportsPayload.rows || []
      });
    } catch {
      setLookups({ bots: [], groups: [], messages: [], videos: [], moduleSettings: [], scamReports: [] });
    }
  }

  async function loadRows(nextSearch = search) {
    if (!table) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = buildScopedQuery(table, nextSearch, selectedBot, selectedGroup);
      const payload = await api(`/api/${table.key}${query}`);
      setRows(payload.rows || []);
      setSelected(null);
      setDraft({});
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (table && (!meta?.passwordRequired || savedPassword)) {
      void loadRows("");
      setSearch("");
      setQuickFilter(table.key === "scam_reports" ? "pending" : "");
      setQuickTestInput("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, savedPassword, selectedBot, selectedGroup, table?.key]);

  useEffect(() => {
    if (meta && (!meta.passwordRequired || savedPassword)) {
      void loadLookups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.passwordRequired, savedPassword, selectedBot]);

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
    if (activeLayer.startsWith("module:")) {
      const moduleKey = activeLayer.replace("module:", "");
      if (moduleKey && moduleKey !== activeModule) {
        setActiveModule(moduleKey);
      }
      return;
    }
    const moduleKey = MODULE_TABLE_OWNER[activeKey];
    if (moduleKey && moduleKey !== activeModule) {
      setActiveModule(moduleKey);
    }
  }, [activeKey, activeLayer, activeModule]);

  useEffect(() => {
    if (activeLayer !== "modules" || moduleEnabled || !enabledModuleCards.length) {
      return;
    }
    const nextModule = enabledModuleCards[0];
    setActiveModule(nextModule.key);
    if (!nextModule.tables.includes(activeKey)) {
      setActiveKey(nextModule.tables[0]);
    }
  }, [activeKey, activeLayer, enabledModuleCards, moduleEnabled]);

  useEffect(() => {
    if (!activeLayer.startsWith("module:")) {
      return;
    }
    if (!moduleLayers.some((layer) => layer.key === activeLayer)) {
      setActiveLayer("modules");
      setActiveKey("module_settings");
    }
  }, [activeLayer, moduleLayers]);

  useEffect(() => {
    if (table?.key !== "config") {
      return;
    }
    if (activeConfigTab && configTabs.some((section) => section.title === activeConfigTab)) {
      return;
    }
    setActiveConfigTab(configTabs[0]?.title || "");
  }, [activeConfigTab, configTabs, table?.key]);
  useEffect(() => {
    const currentLayer = sidebarLayers.find((layer) => layer.key === activeLayer);
    if (currentLayer && layerContainsTable(currentLayer, activeKey)) {
      return;
    }
    const matchingLayer = sidebarLayers.find((layer) => layerContainsTable(layer, activeKey));
    if (matchingLayer) {
      setActiveLayer(matchingLayer.key);
      return;
    }
    if (currentLayer?.tables.length) {
      setActiveKey(currentLayer.tables[0]);
    }
  }, [activeKey, activeLayer, sidebarLayers]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setDraft({});
        setSelected(null);
        setWorkMode((current) => (current === "edit" ? "operate" : current));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function selectLayer(layerKey: string) {
    const layer = sidebarLayers.find((item) => item.key === layerKey);
    if (!layer) {
      return;
    }
    setActiveLayer(layer.key);
    if ("moduleKey" in layer && layer.moduleKey) {
      setActiveModule(String(layer.moduleKey));
    }
    if (!layerContainsTable(layer, activeKey)) {
      setActiveKey(layer.tables[0]);
    }
    setSelected(null);
    setDraft({});
    setSelectedIds(new Set());
    setWorkMode(layer.key === "overview" ? "overview" : "operate");
  }

  function goToInsight(insight: { targetLayer: string; targetTable: string }) {
    selectLayer(insight.targetLayer);
    setActiveKey(insight.targetTable);
    setWorkMode("operate");
  }

  function runCommand(action: () => void) {
    action();
    setCommandOpen(false);
    setCommandSearch("");
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
    setWorkMode("edit");
    setShowAdvancedFields(false);
    setActiveGroupTab("Thông tin");
    setNotice("");
  }

  function startScheduledMessageFlow() {
    const groupTable = meta?.tables.find((item) => item.key === "groups");
    if (!groupTable) {
      return;
    }
    const groupRow = selectedGroup
      ? lookups.groups.find((group) => String(group.group_id || group.chat_id || "") === selectedGroup)
      : table?.key === "groups"
        ? visibleRows[0]
        : null;
    setActiveLayer("module:automation");
    setActiveModule("automation");
    setActiveKey("groups");
    setSelected(groupRow || null);
    setSelectedIds(new Set());
    setDraft({
      ...(groupRow ? draftFromRow(groupRow) : emptyValues(groupTable)),
      bot_key: selectedBot || "main",
      group_id: selectedGroup || groupRow?.group_id || "",
      daily_enabled: true,
      daily_window_start: groupRow?.daily_window_start || "09:00",
      daily_window_end: groupRow?.daily_window_end || "09:00",
      send_if_silent: groupRow?.send_if_silent ?? true,
      message_pool: groupRow?.message_pool || messagePools[0] || "default",
      video_pool: groupRow?.video_pool || videoPools[0] || "",
      enabled: true
    });
    setBulkOpen(false);
    setWorkMode("edit");
    setShowAdvancedFields(false);
    setActiveGroupTab("Lịch gửi");
    setNotice("Flow random tin hẹn giờ đã mở. Chọn group, chọn Nhóm nội dung, đặt giờ rồi lưu.");
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
    setWorkMode("edit");
    setShowAdvancedFields(false);
    setActiveGroupTab("Thông tin");
    setNotice("");
  }

  function inspectRow(row: Row) {
    setSelected(row);
    setDraft({});
    setWorkMode("operate");
    setShowAdvancedFields(false);
    setNotice("");
  }

  function closeFocusedPanel() {
    setDraft({});
    setSelected(null);
    setShowAdvancedFields(false);
    setWorkMode(activeLayer === "overview" ? "overview" : "operate");
  }

  async function toggleSelectedRowEnabled() {
    if (!selected || !table || !table.fields.some((field) => field.key === "enabled")) {
      return;
    }
    if (table.key === "groups" && selected.enabled !== false && !window.confirm("Tắt group sẽ khiến bot bỏ qua protection/runtime cho group này. Bạn vẫn muốn tắt?")) {
      return;
    }
    await saveRowValues(selected, { ...selected, enabled: selected.enabled === false });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!table) {
      return;
    }
    if (table.key === "groups") {
      const issues = dangerousGroupChanges(draft);
      if (issues.length && !window.confirm(`Cấu hình này có rủi ro:\n- ${issues.join("\n- ")}\n\nBạn vẫn muốn lưu?`)) {
        return;
      }
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (selected?.id && !(table.key === "config" && isVirtualConfigRow(selected))) {
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
      setWorkMode(activeLayer === "overview" ? "overview" : "operate");
      if (table.key === "bots") {
        await loadLookups();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu.");
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
      if (table.key === "config" && isVirtualConfigRow(row)) {
        await api(`/api/${table.key}`, {
          method: "POST",
          body: JSON.stringify(values)
        });
      } else {
        await api(`/api/${table.key}`, {
          method: "PATCH",
          body: JSON.stringify({ id: row.id, values })
        });
      }
      setNotice("Đã lưu thay đổi.");
      await loadRows(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu.");
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
      setError(err instanceof Error ? err.message : "Không thể lưu.");
    } finally {
      setSaving(false);
    }
  }

  async function writeAuditLog(action: string, row: Row, details: Row = {}) {
    try {
      await api("/api/audit_logs", {
        method: "POST",
        body: JSON.stringify({
          bot_key: row.bot_key || selectedBot || "main",
          chat_id: row.chat_id || row.group_id || "",
          actor_user_id: "admin_cp",
          action,
          target_user_id: row.target_uid || row.target_username || row.bank_account || row.phone || "",
          details: JSON.stringify({
            report_id: row.id,
            target: scamReportTarget(row),
            reporter: row.reporter_username || row.reporter_user_id || "",
            ...details
          })
        })
      });
    } catch {
      // Audit log should not block the moderation action.
    }
  }

  async function confirmScamReport(row: Row) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api("/api/scam_entities", {
        method: "POST",
        body: JSON.stringify({
          bot_key: row.bot_key || selectedBot || "main",
          uid: row.target_uid || "",
          username: row.target_username || "",
          bank_account: row.bank_account || "",
          phone: row.phone || "",
          name: "",
          risk_level: "scam",
          reason: row.admin_note || "Xác nhận từ báo cáo thành viên",
          evidence: row.evidence || "",
          source: "scam_report",
          status: "confirmed",
          enabled: true
        })
      });
      await api("/api/scam_reports", {
        method: "PATCH",
        body: JSON.stringify({ id: row.id, values: { ...row, status: "confirmed" } })
      });
      await writeAuditLog("scam_report_confirmed", row, { evidence: row.evidence || "" });
      setNotice("Đã xác nhận report và tạo dữ liệu scam.");
      await loadRows(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xác nhận báo cáo scam.");
    } finally {
      setSaving(false);
    }
  }

  async function rejectScamReport(row: Row) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api("/api/scam_reports", {
        method: "PATCH",
        body: JSON.stringify({ id: row.id, values: { ...row, status: "rejected" } })
      });
      await writeAuditLog("scam_report_rejected", row, { admin_note: row.admin_note || "" });
      setNotice("Đã đánh dấu báo cáo là từ chối.");
      await loadRows(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể từ chối báo cáo scam.");
    } finally {
      setSaving(false);
    }
  }

  function selectBot(botKey: string) {
    setSelectedBot(botKey);
    setSelectedGroup("");
    setSelected(null);
    setDraft({});
    setShowAdvancedFields(false);
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
            category: moduleInfo?.title || "Module",
            settings: "{}",
            enabled: true
          })
        });
        setNotice("Đã tạo và bật module.");
        await loadLookups();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tạo module.");
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
      setWorkMode(activeLayer === "overview" ? "overview" : "operate");
      if (table.key === "bots") {
        await loadLookups();
      }
      setNotice("Đã xóa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa.");
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
      setError(err instanceof Error ? err.message : "Không thể xóa các mục đã chọn.");
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

  function applyGroupPreset(values: Row, tab = "Bảo vệ group") {
    setDraft((current) => ({
      ...current,
      ...values
    }));
    setActiveGroupTab(tab);
    setWorkMode("edit");
    setNotice("Đã áp dụng preset vào form. Kiểm tra lại rồi bấm Lưu để cập nhật group.");
  }

  function goToScheduleContent(tableKey: "messages" | "video_messages") {
    setActiveLayer("module:automation");
    setActiveModule("automation");
    setActiveKey(tableKey);
    setWorkMode("operate");
    setSelected(null);
    setDraft({});
    setShowAdvancedFields(false);
  }

  function startGroupProtectionFlow() {
    const groupTable = meta?.tables.find((item) => item.key === "groups");
    if (!groupTable) {
      return;
    }
    const groupRow = selectedGroup
      ? lookups.groups.find((group) => String(group.group_id || group.chat_id || "") === selectedGroup)
      : visibleRows.find((row) => table?.key === "groups");
    setActiveLayer("module:moderation");
    setActiveModule("moderation");
    setActiveKey("groups");
    setSelected(groupRow || null);
    setDraft(groupRow ? draftFromRow(groupRow) : {
      ...emptyValues(groupTable),
      bot_key: selectedBot || "main",
      group_id: selectedGroup || "",
      enabled: true,
      exempt_admins: true,
      spam_action: "warn"
    });
    setActiveGroupTab("Luật spam");
    setShowAdvancedFields(false);
    setWorkMode("edit");
    setNotice("Flow Bảo vệ group đã mở. Chọn preset, kiểm tra tab Luật spam/Tin bot gửi rồi lưu.");
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

  const hasFocusedPanel = Boolean(Object.keys(draft).length || selected);
  const showOverview = workMode === "overview";
  const showOperations = workMode !== "overview";
  const showPrimaryTask = activeLayer !== "modules";
  const readOnlyTable = table?.key === "audit_logs";
  const emptyState = emptyStateFor(table?.key || "");
  const scopeCrumbs = useMemo(() => [
    { label: "Bot", value: currentBot?.name || selectedBot || "Tất cả bot" },
    { label: "Group", value: selectedGroupRow ? String(selectedGroupRow.group_name || selectedGroup) : selectedGroup || "Tất cả group" },
    { label: "Module", value: activeModuleHub.title },
    { label: "Việc", value: table?.label || "Chưa chọn" }
  ], [activeModuleHub.title, currentBot, selectedBot, selectedGroup, selectedGroupRow, table?.label]);
  const groupEditorTabs = useMemo(() => {
    if (table?.key !== "groups") {
      return [];
    }
    const allowedSections = allowedGroupSectionsForLayer(activeLayer);
    const labels = new Map<string, { key: string; label: string; count: number }>();
    for (const [section, fields] of groupedFields(table)) {
      if (!allowedSections.has(section)) {
        continue;
      }
      const label = groupTabLabel(section);
      const visibleCount = fields.filter((field) => showAdvancedFields || !fieldIsAdvanced(table.key, field.key)).length;
      const current = labels.get(label);
      labels.set(label, { key: current?.key || section, label, count: (current?.count || 0) + visibleCount });
    }
    return GROUP_TAB_ORDER
      .map((section) => groupTabLabel(section))
      .filter((label, index, all) => all.indexOf(label) === index)
      .map((label) => labels.get(label) || { key: label, label, count: 0 })
      .filter((tab) => tab.count || tab.label === "Kỹ thuật");
  }, [activeLayer, showAdvancedFields, table]);
  useEffect(() => {
    if (table?.key !== "groups" || !groupEditorTabs.length) {
      return;
    }
    if (!groupEditorTabs.some((tab) => tab.label === activeGroupTab)) {
      setActiveGroupTab(groupEditorTabs[0].label);
    }
  }, [activeGroupTab, groupEditorTabs, table?.key]);
  const editorFieldGroups = useMemo(() => {
    if (!table) {
      return [];
    }
    const groups = groupedFields(table);
    let visibleGroups = groups;
    if (table.key === "groups") {
      const allowed = allowedGroupSectionsForLayer(activeLayer);
      visibleGroups = groups
        .map(([section, fields]) => [section, fields.filter((field) => allowed.has(section))] as [string, FieldConfig[]])
        .filter(([section]) => groupTabLabel(section) === activeGroupTab)
        .filter(([, fields]) => fields.length);
    }
    if (table.key === "groups" && activeGroupTab === "Kỹ thuật") {
      visibleGroups = groups.filter(([section]) => ["Ghi chú", "Advanced"].includes(section));
    }
    return sortGroupFieldGroups(visibleGroups)
      .map(([section, fields]) => {
        const nextFields = fields.filter((field) => showAdvancedFields || !fieldIsAdvanced(table.key, field.key));
        const sectionName = fields.every((field) => fieldIsAdvanced(table.key, field.key)) ? groupTabLabel("Advanced") : groupTabLabel(section);
        return [sectionName, nextFields] as [string, FieldConfig[]];
      })
      .filter(([, fields]) => fields.length);
  }, [activeGroupTab, activeLayer, showAdvancedFields, table]);
  const menuConfigRows = useMemo(() => {
    const map = new Map<string, Row>();
    for (const row of scopedConfigRows) {
      map.set(String(row.key || ""), row);
    }
    return map;
  }, [scopedConfigRows]);
  const menuCommandRows = useMemo(
    () => ["bot_menu_commands", "help_menu_commands", "help_menu_title"].map((key) => menuConfigRows.get(key)).filter((row): row is Row => Boolean(row)),
    [menuConfigRows]
  );
  const menuPolicyRows = useMemo(
    () => ["show_policy_button", "policy_button_text", "policy_text"].map((key) => menuConfigRows.get(key)).filter((row): row is Row => Boolean(row)),
    [menuConfigRows]
  );
  const menuContentRows = useMemo(
    () => ["start_fallback_text"].map((key) => menuConfigRows.get(key)).filter((row): row is Row => Boolean(row)),
    [menuConfigRows]
  );
  const menuCommandsEnabled = menuCommandRows.some((row) => row.enabled !== false && String(row.value || "").trim());
  const policyButtonRow = menuConfigRows.get("show_policy_button");
  const policyButtonEnabled = policyButtonRow ? String(policyButtonRow.value || "").trim().toLowerCase() === "true" && policyButtonRow.enabled !== false : false;

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
            <h1>Cu Bot OS</h1>
            <span>Telegram operations center</span>
          </div>
        </div>
        <nav className="layer-nav">
          <section className="nav-group">
            <h2>Hệ thống</h2>
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
          {moduleLayers.length ? (
          <section className="nav-group">
            <h2>Module đang bật</h2>
            {moduleLayers.map((layer) => {
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
          ) : null}
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

        <section className="scope-breadcrumb" aria-label="Phạm vi vận hành hiện tại">
          {scopeCrumbs.map((crumb) => (
            <span key={crumb.label}>
              <b>{crumb.label}</b>
              {crumb.value}
            </span>
          ))}
        </section>

        <section className="workflow-mode-bar" aria-label="Chế độ làm việc">
          <button type="button" className={workMode === "overview" ? "active" : ""} onClick={() => setWorkMode("overview")}>
            <BarChart3 size={16} />
            <span>Tổng quan</span>
          </button>
          <button type="button" className={workMode === "operate" ? "active" : ""} onClick={() => setWorkMode("operate")}>
            <Activity size={16} />
            <span>Vận hành</span>
          </button>
          <button type="button" className={workMode === "edit" ? "active" : ""} onClick={() => (hasFocusedPanel ? setWorkMode("edit") : startCreate())}>
            <Edit3 size={16} />
            <span>Chỉnh sửa</span>
          </button>
        </section>

        {showOverview ? (
        <>
        <section className="command-center">
          <div className="command-copy">
            <span className="eyebrow">Operations console</span>
            <h2>Làm theo việc cần xử lý, không theo bảng Supabase</h2>
            <p>{commandInsights[0]?.body}</p>
            <div className={`severity-ribbon ${commandInsights[0]?.severity}`}>
              <strong>{commandInsights[0]?.severity?.toUpperCase()}</strong>
              <span>{commandInsights[0]?.impact}</span>
            </div>
            <div className="command-actions">
              {commandInsights.map((insight) => (
                <button key={insight.title} type="button" className={insight.severity === "healthy" ? "secondary" : "primary"} onClick={() => goToInsight(insight)}>
                  {insight.action}
                </button>
              ))}
              <button type="button" className="ghost dark" onClick={() => setCommandOpen(true)}>
                Mở command palette
              </button>
            </div>
          </div>
          <div className="live-feed">
            <div className="live-feed-head">
              <span className="live-dot on" />
              <strong>Hoạt động live</strong>
            </div>
            {liveActivity.map((item) => (
              <span key={item.text} className={`event-line ${item.severity}`}>
                <i />
                {item.text}
              </span>
            ))}
          </div>
        </section>

        <section className="ops-task-board">
          <div className="ops-task-head">
            <div>
              <span className="eyebrow">Bảng tác vụ admin</span>
              <h3>Chọn việc cần làm</h3>
            </div>
            <button type="button" className="ghost" onClick={() => setCommandOpen(true)}>
              Mở tìm nhanh
            </button>
          </div>
          <div className="ops-task-grid">
            {operationTasks.map((task) => {
              const TaskIcon = task.icon;
              return (
                <button key={task.title} type="button" className={`ops-task-card ${task.tone}`} onClick={task.action}>
                  <span className="ops-task-icon">
                    <TaskIcon size={19} />
                  </span>
                  <strong>{task.title}</strong>
                  <p>{task.desc}</p>
                  <small>{task.meta}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="production-readiness">
          <div>
            <span className="eyebrow">Production readiness</span>
            <h3>Kiểm tra nền deploy</h3>
            <p>CP đọc trực tiếp trạng thái env public/server-side và dữ liệu vận hành trong scope hiện tại.</p>
          </div>
          <div className="readiness-grid">
            {[
              { label: "Supabase URL", ok: meta.envStatus?.supabaseUrl },
              { label: "Service role key", ok: meta.envStatus?.serviceRoleKey },
              { label: "CP password", ok: meta.envStatus?.cpPassword },
              { label: "Bot token env", ok: meta.envStatus?.botToken },
              { label: "Bot key env", ok: meta.envStatus?.botKey },
              { label: "Runtime", ok: true, value: meta.envStatus?.runtimeMode || "unknown" }
            ].map((item) => (
              <span key={item.label} className={item.ok ? "ok" : "warn"}>
                <b>{item.label}</b>
                {item.value || (item.ok ? "OK" : "Thiếu")}
              </span>
            ))}
          </div>
        </section>

        <section className="status-dashboard">
          <article className={healthSummary.disabledBots ? "status-card warning" : "status-card ok"}>
            <span>Bot đang online</span>
            <strong>{healthSummary.activeBots}</strong>
            <p>{healthSummary.disabledBots ? `${healthSummary.disabledBots} bot đang tắt` : "Các bot chính đang sẵn sàng"}</p>
          </article>
          <article className="status-card ok">
            <span>Module đang bật</span>
            <strong>{healthSummary.enabledModules}</strong>
            <p>{healthSummary.offModules ? `${healthSummary.offModules} module tùy chọn đang ẩn` : "Tất cả module đã bật đang hiện ở sidebar"}</p>
          </article>
          <article className={healthSummary.groups ? "status-card ok" : "status-card warning"}>
            <span>Nhóm đang được bảo vệ</span>
            <strong>{healthSummary.groups}</strong>
            <p>{healthSummary.groups ? "Bot có phạm vi hoạt động" : "Chưa có group cho bot này"}</p>
          </article>
          <article className={healthSummary.issues ? "status-card danger" : "status-card ok"}>
            <span>Việc cần xử lý</span>
            <strong>{healthSummary.issues}</strong>
            <p>{healthSummary.issues ? "Có env/setup/pending review cần kiểm tra" : "Không có lỗi vận hành bắt buộc"}</p>
          </article>
        </section>
        </>
        ) : null}

        {showOperations ? (
        <>
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
          {activeLayer !== "modules" ? (
          <div className="layer-links">
            {layerTables.map((item) => (
              <button key={item.key} type="button" className={activeKey === item.key ? "active" : ""} onClick={() => setActiveKey(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
          ) : null}
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
          <div className="module-section-head">
            <div>
              <h3>Quản lý module</h3>
              <p>Bật module giống plugin. Module đang bật sẽ xuất hiện trên sidebar và có trang cài đặt riêng.</p>
            </div>
            <span>{enabledModuleCards.length}/{moduleCards.length} đang bật</span>
          </div>
          <div className="plugin-manager" role="list" aria-label="Quản lý module">
            {moduleCards.map((module) => {
              const ModuleIcon = module.icon;
              return (
                <article className={`plugin-card ${module.isOn ? "enabled" : "disabled"}`} key={module.key}>
                  <div className="plugin-main">
                    <ModuleIcon size={20} />
                    <div>
                      <h3>{module.title}</h3>
                      <p>{module.desc}</p>
                      <div className="plugin-status-box">
                        <span>Trạng thái module</span>
                        <strong>{module.isOn ? "Bật" : "Tắt"}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="plugin-actions">
                    <div className="plugin-action-row">
                      <button
                        type="button"
                        className={`module-switch ${module.isOn ? "on" : "off"}`}
                        disabled={saving}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setActiveModule(module.key);
                          void toggleModule((module.moduleKeys || [module.key])[0]);
                        }}
                        title={module.isOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                      >
                        <span />
                      </button>
                    {module.isOn ? (
                      <button
                        type="button"
                        className="module-edit-button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          selectLayer(`module:${module.key}`);
                        }}
                        title="Cài đặt module"
                      >
                        <Edit3 size={20} />
                      </button>
                    ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        ) : null}

        {activeLayer.startsWith("module:") && activeModuleHub.key === "automation" ? (
          <>
            <section className="module-flow-launcher">
              <div>
                <span>Phase 3 workflow</span>
                <h3>Gửi tin định kỳ không cần nhớ bảng Supabase</h3>
                <p>Chọn group, chọn pool, xem preview nội dung, đặt giờ rồi lưu vào cấu hình group runtime.</p>
              </div>
              <button type="button" className="primary" onClick={startScheduledMessageFlow}>
                <Plus size={17} />
                Mở wizard lịch gửi
              </button>
            </section>
            <section className="schedule-wizard">
              <div className="schedule-steps">
                {SCHEDULE_STEPS.map((step, index) => (
                  <span key={step.title} className={index === 0 || (index === 1 && scheduleMessagePool) || (index === 2 && scheduleMessagePreview.length) ? "done" : ""}>
                    <b>{index + 1}</b>
                    <strong>{step.title}</strong>
                    {step.desc}
                  </span>
                ))}
              </div>
              <div className="schedule-preview-grid">
                <article className={scheduleIssues.length ? "schedule-status warning" : "schedule-status ready"}>
                  <h4>Trạng thái lịch</h4>
                  <strong>{scheduleIssues.length ? `${scheduleIssues.length} cần xử lý` : "Sẵn sàng lưu"}</strong>
                  <p>
                    Group: {scheduleSubject.group_name || scheduleSubject.group_id || selectedGroup || "Chưa chọn"} ·
                    Giờ: {scheduleSubject.daily_window_start || "09:00"} - {scheduleSubject.daily_window_end || "09:00"}
                  </p>
                  {scheduleIssues.length ? (
                    <ul>
                      {scheduleIssues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
                <article className="pool-preview">
                  <div>
                    <h4>Pool tin nhắn</h4>
                    <button type="button" className="ghost" onClick={() => goToScheduleContent("messages")}>Mở kho tin</button>
                  </div>
                  <strong>{scheduleMessagePool || "Chưa chọn pool"}</strong>
                  <p>{scheduleMessagePreview.length} tin đang bật trong pool này</p>
                  <div className="pool-preview-list">
                    {scheduleMessagePreview.slice(0, 3).map((row) => (
                      <span key={row.id || row.message}>{poolPreviewText(row, "message")}</span>
                    ))}
                    {!scheduleMessagePreview.length ? <span>Chưa có tin để preview.</span> : null}
                  </div>
                </article>
                <article className="pool-preview">
                  <div>
                    <h4>Pool video</h4>
                    <button type="button" className="ghost" onClick={() => goToScheduleContent("video_messages")}>Mở kho video</button>
                  </div>
                  <strong>{scheduleVideoPool || "Chưa chọn pool"}</strong>
                  <p>{scheduleVideoPreview.length} video đang bật trong pool này</p>
                  <div className="pool-preview-list">
                    {scheduleVideoPreview.slice(0, 3).map((row) => (
                      <span key={row.id || `${row.from_chat_id}-${row.message_id}`}>{poolPreviewText(row, "video")}</span>
                    ))}
                    {!scheduleVideoPreview.length ? <span>Chưa có video để preview.</span> : null}
                  </div>
                </article>
              </div>
              <div className="schedule-actions">
                <button type="button" className="secondary" onClick={() => goToScheduleContent("messages")}>Thêm tin vào pool</button>
                <button type="button" className="secondary" onClick={() => goToScheduleContent("video_messages")}>Thêm video vào pool</button>
                <button type="button" className="primary" onClick={startScheduledMessageFlow}>Đặt giờ trên group</button>
              </div>
            </section>
          </>
        ) : null}

        {activeLayer.startsWith("module:") && activeModuleHub.key === "moderation" ? (
          <section className="protection-flow-launcher">
            <div>
              <span>Flow bảo vệ group</span>
              <h3>Chọn group, bật luật, test tin nhắn, rồi xem logs</h3>
              <p>Flow này gom cấu hình group, spam action, keyword/domain và audit log vào một đường đi rõ ràng.</p>
            </div>
            <div className="protection-score">
              <strong>{selectedGroupProtection.enabledChecks}/{selectedGroupProtection.totalChecks}</strong>
              <span>{selectedGroupProtection.ready ? "Protection đủ điều kiện nền" : selectedGroupProtection.warnings[0]}</span>
            </div>
            <button type="button" className="primary" onClick={startGroupProtectionFlow}>
              <ShieldCheck size={17} />
              Mở flow bảo vệ
            </button>
          </section>
        ) : null}

        {showPrimaryTask ? (
        <>
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
            <div className="mode-switch" aria-label="Chế độ hiển thị">
              <button type="button" className={scanMode === "scan" ? "active" : ""} onClick={() => setScanMode("scan")}>
                Scan
              </button>
              <button type="button" className={scanMode === "detail" ? "active" : ""} onClick={() => setScanMode("detail")}>
                Detail
              </button>
            </div>
            {readOnlyTable ? null : table.key !== "config" ? (
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
              <button type="button" className="secondary" onClick={closeFocusedPanel} disabled={!Object.keys(draft).length}>
                <X size={17} />
                Đóng mục đang sửa
              </button>
            )}
            {!readOnlyTable && bulkTables.has(table.key) ? (
              <button type="button" className="secondary" onClick={() => setBulkOpen((value) => !value)}>
                <Edit3 size={17} />
                Nhập nhanh
              </button>
            ) : null}
          </div>
        </header>

        {error ? <div className="alert error">{error}</div> : null}
        {notice ? <div className="alert success">{notice}</div> : null}

        {table.key === "audit_logs" ? (
          <section className="audit-console">
            <div>
              <span className="eyebrow">Operational audit</span>
              <h3>Nhật ký mới nhất nằm trên đầu</h3>
              <p>Danh sách chỉ hiện thời gian, hành động, người thực hiện, đối tượng và group. Mở inspector khi cần xem nội dung/raw details.</p>
            </div>
            <div className="audit-console-stats">
              <span><b>{auditStats.total}</b>Tổng log</span>
              <span className="critical"><b>{auditStats.critical}</b>Nghiêm trọng</span>
              <span className="warning"><b>{auditStats.warning}</b>Cần chú ý</span>
              <span><b>{auditStats.latestTime}</b>Mới nhất</span>
            </div>
          </section>
        ) : null}

        {table.key === "scam_reports" ? (
          <section className="scam-inbox">
            <div className="scam-inbox-copy">
              <span className="eyebrow">Phase 4 review inbox</span>
              <h3>Duyệt báo cáo scam</h3>
              <p>Mặc định chỉ hiện report chờ duyệt. Mở từng report để xác nhận tạo dữ liệu scam, từ chối report sai hoặc sửa thông tin trước khi xác nhận.</p>
            </div>
            <div className="scam-inbox-stats">
              <span className="pending"><b>{scamInboxStats.pending}</b>Chờ duyệt</span>
              <span className="confirmed"><b>{scamInboxStats.confirmed}</b>Đã xác nhận</span>
              <span className="rejected"><b>{scamInboxStats.rejected}</b>Từ chối</span>
            </div>
          </section>
        ) : null}

        {table.key !== "config" ? (
          <section className="quick-filter-bar">
            {quickFilters.map((filter) => (
              <button
                key={filter.key || "all"}
                type="button"
                className={quickFilter === filter.key ? "active" : ""}
                onClick={() => setQuickFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </section>
        ) : null}

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

        {activeKey === "bot_metrics" || activeKey === "groups" || activeLayer === "overview" ? (
          <section className={`ops-checklist ${setupIssues.length ? "needs-work" : "ready"}`}>
            <div className="ops-checklist-head">
              <div>
                <h3>Checklist setup vận hành</h3>
                <p>{setupIssues.length ? "Các mục dưới đây quyết định bot có chạy đúng trong group hay không." : "Các điều kiện nền đã đủ để vận hành trong phạm vi hiện tại."}</p>
              </div>
              <strong>{setupChecklist.length - setupIssues.length}/{setupChecklist.length}</strong>
            </div>
            <div className="ops-checklist-grid">
              {setupChecklist.map((item) => (
                <span key={item.label} className={item.done ? "done" : "missing"}>
                  {item.done ? <Check size={15} /> : <X size={15} />}
                  <b>{item.label}</b>
                  {item.detail}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {table.key === "scheduled_posts" || (activeLayer.startsWith("module:") && activeModuleHub.key === "automation" && table.key === "groups") ? (
          <section className="runtime-note">
            <SlidersHorizontal size={20} />
            <div>
              <h3>Lịch gửi runtime đang điều khiển từ Group</h3>
              <p>
                Bot hiện dùng `groups.daily_*`, `groups.message_pool`, `groups.video_*` cùng kho `messages`/`video_messages`.
                Bảng `scheduled_posts` chỉ nên xem như dữ liệu kỹ thuật hoặc mở rộng sau này.
              </p>
            </div>
            <button type="button" className="secondary" onClick={startScheduledMessageFlow}>
              Mở flow đúng
            </button>
          </section>
        ) : null}

        {showRuleTester ? (
          <section className="rule-tester">
            <div>
              <h3>Test nhanh luật đang bật</h3>
              <p>Paste một tin nhắn hoặc link để biết rule nào sẽ khớp trong phạm vi hiện tại.</p>
            </div>
            <label>
              <span>Nội dung test</span>
              <input
                value={quickTestInput}
                onChange={(event) => setQuickTestInput(event.target.value)}
                placeholder={table.key === "auto_replies" ? "Ví dụ: shop có hỗ trợ không?" : "Ví dụ: tin nhắn có keyword hoặc link cần kiểm tra"}
              />
            </label>
            <div className="rule-test-results">
              {quickTestInput ? (
                ruleTestResults.length ? (
                  ruleTestResults.slice(0, 5).map((result) => (
                    <span key={`${result.label}-${result.detail}`} className="matched">
                      <Check size={14} />
                      <b>{result.label}</b>
                      {result.detail}
                    </span>
                  ))
                ) : (
                  <span className="clean">
                    <ShieldCheck size={14} />
                    Không khớp rule nào đang bật
                  </span>
                )
              ) : (
                <span className="idle">Chưa nhập nội dung test</span>
              )}
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

        {activeLayer === "module:menu_policy" && table.key === "config" ? (
          <section className="menu-policy-console">
            <section className="menu-policy-hero">
              <div>
                <span>Menu & nội quy</span>
                <h3>Điều khiển những gì user thấy khi gõ `/` hoặc `/start`</h3>
                <p>Tắt menu lệnh Telegram sẽ xóa danh sách `/start`, `/help`, `/policy` khỏi khung gợi ý của Telegram sau khi bot sync.</p>
              </div>
              <div className="menu-policy-status">
                <span className={menuCommandsEnabled ? "on" : "off"}>{menuCommandsEnabled ? "Menu lệnh đang bật" : "Menu lệnh đang tắt"}</span>
                <span className={policyButtonEnabled ? "on" : "off"}>{policyButtonEnabled ? "Nút Quy định đang bật" : "Nút Quy định đang tắt"}</span>
              </div>
            </section>

            <div className="menu-policy-grid">
              <section className="menu-control-card primary">
                <div className="menu-control-head">
                  <div>
                    <MessageSquare size={21} />
                    <h4>Menu lệnh Telegram</h4>
                    <p>Danh sách lệnh hiện trong khung gợi ý khi thành viên gõ dấu `/`.</p>
                  </div>
                  <strong>{menuCommandsEnabled ? "Đang hiện" : "Đang ẩn"}</strong>
                </div>
                <div className="menu-control-rows">
                  {menuCommandRows.map((row) => (
                    <article key={row.id || row.key} className={row.enabled === false ? "disabled" : ""}>
                      <div>
                        <b>{configLabel(String(row.key || ""))}</b>
                        <span>{configDescription(row)}</span>
                        <strong>{configDisplayValue(row)}</strong>
                      </div>
                      <button type="button" className="setting-edit-button" onClick={() => startEdit(row)} title="Sửa">
                        <Edit3 size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="menu-control-card">
                <div className="menu-control-head">
                  <div>
                    <ShieldCheck size={21} />
                    <h4>Nút Quy định</h4>
                    <p>Nút inline nằm dưới tin `/start` và `/help` để mở nội quy nhóm.</p>
                  </div>
                  <strong>{policyButtonEnabled ? "Đang hiện" : "Đang ẩn"}</strong>
                </div>
                <div className="menu-control-rows">
                  {menuPolicyRows.map((row) => {
                    const booleanValue = isConfigBoolean(row);
                    const valueOn = String(row.value).toLowerCase() === "true";
                    return (
                      <article key={row.id || row.key} className={row.enabled === false ? "disabled" : ""}>
                        <div>
                          <b>{configLabel(String(row.key || ""))}</b>
                          <span>{configDescription(row)}</span>
                          <strong>{configDisplayValue(row)}</strong>
                        </div>
                        <div className="menu-row-actions">
                          {booleanValue ? (
                            <button
                              type="button"
                              className={`toggle-switch small ${valueOn ? "on" : "off"}`}
                              disabled={saving}
                              onClick={() => toggleConfigValue(row)}
                              title={valueOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                            >
                              <span />
                            </button>
                          ) : null}
                          <button type="button" className="setting-edit-button" onClick={() => startEdit(row)} title="Sửa">
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="menu-control-card">
                <div className="menu-control-head">
                  <div>
                    <Sparkles size={21} />
                    <h4>Nội dung trả lời</h4>
                    <p>Text fallback khi `/start` chưa có tin nhắn random và nội dung liên quan.</p>
                  </div>
                </div>
                <div className="menu-control-rows">
                  {menuContentRows.map((row) => (
                    <article key={row.id || row.key} className={row.enabled === false ? "disabled" : ""}>
                      <div>
                        <b>{configLabel(String(row.key || ""))}</b>
                        <span>{configDescription(row)}</span>
                        <strong>{configDisplayValue(row)}</strong>
                      </div>
                      <button type="button" className="setting-edit-button" onClick={() => startEdit(row)} title="Sửa">
                        <Edit3 size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            {Object.keys(draft).length ? (
              <section className="menu-inline-editor">
                <form className="setting-edit" onSubmit={save}>
                  <div className="editor-title">
                    <h3>Chỉnh sửa {configLabel(String(draft.key || ""))}</h3>
                    <button type="button" className="icon-button" onClick={closeFocusedPanel}>
                      <X size={17} />
                    </button>
                  </div>
                  {String(draft.value ?? "").trim().toLowerCase() === "true" || String(draft.value ?? "").trim().toLowerCase() === "false" ? (
                    <label className="checkbox-field">
                      <span>Bật giá trị này</span>
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
                              {configPlaceholders(String(draft.key || "")).length ? (
                                <small>Placeholder: {configPlaceholders(String(draft.key || "")).join(" · ")}</small>
                              ) : configFieldHint(String(draft.key || "")) ? (
                                <small>{configFieldHint(String(draft.key || ""))}</small>
                              ) : null}
                            </label>
                          )}
                  <label className="checkbox-field">
                    <span>Kích hoạt cấu hình này</span>
                    <input
                      type="checkbox"
                      checked={Boolean(draft.enabled)}
                      onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
                    />
                  </label>
                  <div className="setting-edit-actions">
                    <button type="button" className="ghost" onClick={closeFocusedPanel}>
                      Hủy
                    </button>
                    <button type="submit" className="primary" disabled={saving}>
                      {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                      Lưu
                    </button>
                  </div>
                </form>
              </section>
            ) : null}
          </section>
        ) : table.key === "config" ? (
          <section className="config-center">
            {activeLayer === "module:moderation" ? (
              <section className="config-closed-state">
                <ShieldCheck size={28} />
                <strong>Moderation được cấu hình trong group</strong>
                <span>Từ nay phần moderation chỉ chỉnh trong setup group. Không dùng module default nữa để tránh trùng chỗ.</span>
                <button type="button" className="primary" onClick={() => startGroupProtectionFlow()}>
                  Mở setup group
                </button>
              </section>
            ) : null}
            {activeLayer !== "module:moderation" ? (
              <>
            <div className="config-tabs" aria-label="Cây nhóm cài đặt">
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
                                className={`toggle-switch small ${valueOn ? "on" : "off"}`}
                                disabled={saving}
                                onClick={() => toggleConfigValue(row)}
                                title={valueOn ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                              >
                                <span />
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
                                {configPlaceholders(String(draft.key || "")).length ? (
                                  <small>Placeholder: {configPlaceholders(String(draft.key || "")).join(" · ")}</small>
                                ) : configFieldHint(String(draft.key || "")) ? (
                                  <small>{configFieldHint(String(draft.key || ""))}</small>
                                ) : null}
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
                              <button type="button" className="ghost" onClick={closeFocusedPanel}>
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
            {!activeConfigSection && activeLayer === "settings" ? (
              <section className="config-closed-state">
                <SlidersHorizontal size={28} />
                <strong>Không còn cài đặt toàn cục cần chỉnh ở đây</strong>
                <span>Global đã được thu gọn để tránh trùng với module và group. Muốn đổi mặc định, mở module tương ứng; muốn đổi theo group, mở group đó.</span>
              </section>
            ) : null}
            {!activeConfigSection && activeLayer !== "settings" ? (
              <section className="config-closed-state">
                <SlidersHorizontal size={28} />
                <strong>Advanced config đang được thu gọn</strong>
                <span>Chọn một nhóm cài đặt phía trên khi cần sửa sâu. Mặc định CP chỉ hiển thị trạng thái và hành động chính.</span>
              </section>
            ) : null}
              </>
            ) : null}
          </section>
        ) : (
        <div className={`content-grid ${hasFocusedPanel ? "focus-mode" : ""} ${workMode === "edit" ? "edit-mode" : ""}`}>
          <section className="list-panel">
            <div className="list-header">
              <div>
                <strong>{visibleRows.length}</strong>
                <span> mục</span>
              </div>
              <span>{scanMode === "scan" ? "Scan mode: chỉ hiện trạng thái chính" : "Detail mode: hiện thêm ngữ cảnh"}</span>
            </div>

            <div className={`card-list ${scanMode}`}>
              {visibleRows.map((row) => (
                <article className={`data-card ${readOnlyTable ? "audit-card" : ""} ${table.key === "scam_reports" ? "scam-report-card" : ""} ${selected?.id === row.id ? "selected" : ""}`} key={row.id}>
                  {!readOnlyTable ? (
                  <label className="select-card" title="Chọn mục này">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(String(row.id))}
                      onChange={() => toggleSelected(row.id)}
                    />
                    <span />
                  </label>
                  ) : null}
                  <button className="card-main" type="button" onClick={() => inspectRow(row)}>
                    <div className="card-title-row">
                      <h3>{titleFor(row, table)}</h3>
                      <div className="card-state">
                        <span className={`health ${healthState(row).className}`}>{healthState(row).label}</span>
                        <span className="action-badge">{actionBadge(row, table)}</span>
                      </div>
                    </div>
                    <p>{readOnlyTable ? auditLogSummary(row) : previewText(row, table) || "Chưa có nội dung mô tả."}</p>
                    {table.key === "scam_reports" ? (
                      <div className="scam-report-facts">
                        {scamReportFacts(row).map((item) => (
                          <span key={item.label}>
                            <b>{item.label}</b>
                            {item.value}
                          </span>
                        ))}
                      </div>
                    ) : readOnlyTable ? (
                      <div className={`audit-log-row ${auditLogSeverity(row)}`}>
                        <span className="audit-marker" />
                        {auditLogEssentials(row).slice(0, 4).map((item) => (
                          <span key={item.label}>
                            <b>{item.label}</b>
                            {item.value}
                          </span>
                        ))}
                      </div>
                    ) : scanMode === "detail" ? (
                      <div className="meta-grid">
                      {table.summaryFields.slice(0, 2).map((key) => {
                        const field = fieldByKey(table, key);
                        return (
                          <span className="meta-pill" key={key}>
                            <b>{field?.label || key}</b>
                            {displayValue(row[key])}
                          </span>
                        );
                      })}
                      </div>
                    ) : null}
                  </button>
                  {!readOnlyTable ? (
                  <div className="card-actions">
                    {table.key === "scam_reports" && row.status !== "confirmed" ? (
                      <button type="button" title="Xác nhận scam" disabled={saving} onClick={() => confirmScamReport(row)}>
                        <ShieldCheck size={16} />
                      </button>
                    ) : null}
                    <button type="button" title="Sửa" onClick={() => startEdit(row)}>
                      <Edit3 size={16} />
                    </button>
                    <button type="button" title="Xóa" onClick={() => remove(row)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  ) : null}
                </article>
              ))}
              {!visibleRows.length && !loading ? (
                <div className="empty-state">
                  <ShieldCheck size={28} />
                  <strong>{emptyState.title}</strong>
                  <span>{emptyState.body}</span>
                  <ol>
                    {emptyState.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  {!readOnlyTable ? (
                  <button type="button" className="primary" onClick={startCreate}>
                    <Plus size={16} />
                    {emptyState.action}
                  </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          {hasFocusedPanel ? (
          <section className="editor-panel" role="dialog" aria-label={Object.keys(draft).length ? "Chế độ chỉnh sửa" : "Inspector vận hành"}>
              {Object.keys(draft).length ? (
              <form onSubmit={save}>
                <div className="editor-title">
                  <div>
                    <span className="eyebrow">Form vận hành</span>
                    <h3>{selected ? "Chỉnh sửa" : "Thêm mới"}</h3>
                  </div>
                  <div className="editor-title-actions">
                    <button type="button" className={showAdvancedFields ? "secondary active" : "secondary"} onClick={() => setShowAdvancedFields((value) => !value)}>
                      <SlidersHorizontal size={16} />
                      Advanced
                    </button>
                    <button type="button" className="icon-button" onClick={closeFocusedPanel}>
                      <X size={17} />
                    </button>
                  </div>
                </div>
                {!showAdvancedFields ? (
                  <div className="advanced-hint">
                    Đang ẩn field kỹ thuật như ID, timestamp, JSON settings và raw config key.
                  </div>
                ) : null}
                {table.key === "groups" ? (
                  <>
                    <div className="group-editor-tabs" aria-label="Nhóm cấu hình group">
                      {groupEditorTabs.map((tab) => (
                        <button
                          key={tab.label}
                          type="button"
                          className={activeGroupTab === tab.label ? "active" : ""}
                          onClick={() => {
                            setActiveGroupTab(tab.label);
                            if (tab.label === "Kỹ thuật") {
                              setShowAdvancedFields(true);
                            }
                          }}
                        >
                          {tab.label}
                          <b>{tab.count}</b>
                        </button>
                      ))}
                    </div>
                    <div className="group-scope-callout">
                      <strong>Đây là setup cho group đang chọn.</strong>
                      <span>Luật spam, mẫu tin, ban/mute và bio link đều chỉnh ngay trong group này. Không cần đi qua module default.</span>
                    </div>
                    {activeGroupTab === "Bảo vệ group" || activeGroupTab === "Luật spam" ? (
                      <section className="group-presets">
                        <div>
                          <h4>Preset nhanh</h4>
                          <p>Áp dụng vào form hiện tại, sau đó vẫn cần bấm Lưu.</p>
                        </div>
                        {GROUP_PRESETS.map((preset) => (
                          <button key={preset.key} type="button" onClick={() => applyGroupPreset(preset.values, preset.key === "safe_mode" ? "Luật spam" : "Bảo vệ group")}>
                            <strong>{preset.title}</strong>
                            <span>{preset.desc}</span>
                          </button>
                        ))}
                      </section>
                    ) : null}
                  </>
                ) : null}
                <div className="fields">
                  {editorFieldGroups.map(([section, fields]) => (
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
                              {configPlaceholders(field.key).length ? (
                                <small>Placeholder: {configPlaceholders(field.key).join(" · ")}</small>
                              ) : null}
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
            ) : selected ? (
              <div className="inspector-shell">
                <div className="inspector-head">
                  <div>
                    <span className="eyebrow">Buồng điều khiển vận hành</span>
                    <span className={`health ${healthState(selected).className}`}>{healthState(selected).label}</span>
                  </div>
                  <div className="editor-title-actions">
                    <button type="button" className={showAdvancedFields ? "secondary active" : "secondary"} onClick={() => setShowAdvancedFields((value) => !value)}>
                      <SlidersHorizontal size={16} />
                      Advanced
                    </button>
                    <button type="button" className="icon-button" onClick={closeFocusedPanel}>
                      <X size={17} />
                    </button>
                  </div>
                </div>
                <h3>{titleFor(selected, table)}</h3>
                <p>{readOnlyTable ? auditLogSummary(selected) : previewText(selected, table) || "Chưa có mô tả cho mục này."}</p>
                {table.key === "scam_reports" ? (
                  <section className="scam-review-detail">
                    <div className="scam-review-facts">
                      {scamReportFacts(selected).map((item) => (
                        <span key={item.label}>
                          <b>{item.label}</b>
                          {item.value}
                        </span>
                      ))}
                    </div>
                    <div className="scam-evidence-box">
                      <b>Bằng chứng</b>
                      <p>{displayValue(selected.evidence)}</p>
                    </div>
                  </section>
                ) : null}
                <div className="cockpit-metrics">
                  {cockpitMetrics(selected, table).map((metric) => (
                    <span key={metric.label}>
                      <b>{metric.value}</b>
                      {metric.label}
                    </span>
                  ))}
                </div>
                {!readOnlyTable ? (
                <div className="inspector-actions">
                  <button type="button" className="primary" onClick={() => startEdit(selected)}>
                    <Edit3 size={16} />
                    Sửa nhanh
                  </button>
                  {table.fields.some((field) => field.key === "enabled") ? (
                    <button type="button" className="secondary" disabled={saving} onClick={toggleSelectedRowEnabled}>
                      <Power size={16} />
                      {selected.enabled === false ? "Bật lại" : "Tắt"}
                    </button>
                  ) : null}
                  {table.key === "scam_reports" && selected.status !== "confirmed" ? (
                    <button type="button" className="secondary" disabled={saving} onClick={() => confirmScamReport(selected)}>
                      <ShieldCheck size={16} />
                      Xác nhận scam
                    </button>
                  ) : null}
                  {table.key === "scam_reports" && selected.status !== "confirmed" ? (
                    <button type="button" className="secondary" onClick={() => startEdit(selected)}>
                      <Edit3 size={16} />
                      Sửa trước khi xác nhận
                    </button>
                  ) : null}
                  {table.key === "scam_reports" && selected.status !== "rejected" ? (
                    <button type="button" className="ghost" disabled={saving} onClick={() => rejectScamReport(selected)}>
                      <X size={16} />
                      Từ chối report
                    </button>
                  ) : null}
                  <button type="button" className="ghost" onClick={() => remove(selected)}>
                    <Trash2 size={16} />
                    Xóa
                  </button>
                </div>
                ) : null}
                <section className="inspector-section">
                  <h4>{readOnlyTable ? "Chi tiết nhật ký" : "Chi tiết vận hành"}</h4>
                  <div className="inspector-grid">
                    {(readOnlyTable ? auditLogRows(selected) : detailRows(selected, table)).map((item) => (
                      <span key={String("key" in item ? item.key : item.label)}>
                        <b>{item.label}</b>
                        {item.value}
                      </span>
                    ))}
                  </div>
                </section>
                {showAdvancedFields && !readOnlyTable ? (
                  <section className="inspector-section advanced-section">
                    <h4>Advanced</h4>
                    <div className="inspector-grid">
                      {advancedDetailRows(selected, table).map((item) => (
                        <span key={item.key}>
                          <b>{item.label}</b>
                          {item.value}
                        </span>
                      ))}
                      {!advancedDetailRows(selected, table).length ? <span>Không có field kỹ thuật trong mục này.</span> : null}
                    </div>
                  </section>
                ) : null}
                {!readOnlyTable ? (
                <>
                <section className="inspector-section">
                  <h4>Chẩn đoán runtime</h4>
                  <div className="diagnostic-grid">
                    <span className="ok">Runtime đã tải</span>
                    <span className="ok">Phạm vi đã xác định</span>
                    <span className={selected.enabled === false ? "warn" : "ok"}>{selected.enabled === false ? "Không tham gia runtime" : "Đang tham gia runtime"}</span>
                  </div>
                </section>
                <section className="inspector-section">
                  <h4>Dòng thời gian hoạt động</h4>
                  <div className="activity-stream">
                    {cockpitActivity(selected, table).map((item) => (
                      <span key={item}><i />{item}</span>
                    ))}
                  </div>
                </section>
                <section className="inspector-section suggestion-box">
                  <h4>Gợi ý bước tiếp theo</h4>
                  <p>{selected.enabled === false ? "Bật mục này nếu nó cần tham gia protection/runtime." : "Chạy test nhanh hoặc xem logs gần đây trước khi sửa cấu hình nâng cao."}</p>
                </section>
                <section className="inspector-section">
                  <h4>Công cụ test</h4>
                  <button type="button" className="ghost" onClick={() => setNotice("Test tool UI đã sẵn sàng. Phần runtime test sẽ nối ở bước backend tiếp theo.")}>
                    Test mục này
                  </button>
                </section>
                </>
                ) : null}
              </div>
            ) : null}
          </section>
          ) : null}
        </div>
        )}
        </>
        ) : null}
        </>
        ) : null}
      </section>
      {commandOpen ? (
        <section className="command-palette-backdrop" onClick={() => setCommandOpen(false)}>
          <div className="command-palette" onClick={(event) => event.stopPropagation()}>
            <div className="command-palette-head">
              <Search size={18} />
              <input
                value={commandSearch}
                onChange={(event) => setCommandSearch(event.target.value)}
                placeholder="Gõ command: bật anti spam, mở logs, áp dụng preset..."
                autoFocus
              />
              <span>⌘K</span>
            </div>
            <div className="command-palette-list">
              {filteredCommandItems.map((item) => (
                <button key={item.title} type="button" onClick={() => runCommand(item.action)}>
                  <strong>{item.title}</strong>
                  <span>{item.hint}</span>
                </button>
              ))}
              {!filteredCommandItems.length ? (
                <div className="command-empty">Không tìm thấy command phù hợp. Thử “logs”, “preset”, “permission” hoặc “automation”.</div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
