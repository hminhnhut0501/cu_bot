import {
  Activity,
  Archive,
  BarChart3,
  Bot,
  ClipboardList,
  Gift,
  MessageSquare,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import type { BulkDefaults } from "./cp-types";

export const drawerWidth = 292;
export const drawerCollapsedWidth = 88;

export const defaultBoolean = new Set(["enabled", "daily_enabled", "delete_system_messages", "delete_forwarded_messages", "allow_forward_messages", "allow_automatic_forwards"]);
export const CONFIG_BOOLEAN_KEYS = new Set([
  "emoji_spam_enabled",
  "moderation_enabled",
  "delete_system_messages",
  "delete_forwarded_messages",
  "allow_forward_messages",
  "forward_allowed_sources",
  "scan_hidden_links",
  "scan_text_link",
  "scan_text_mention",
  "allow_in_group_mentions",
  "allow_automatic_forwards",
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
export const CONFIG_SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  delete: [
    { value: "delete", label: "Xóa tin" },
    { value: "warn", label: "Cảnh báo" },
    { value: "restrict", label: "Hạn chế chat" },
    { value: "ban", label: "Ban khỏi nhóm" }
  ],
  warn: [
    { value: "warn", label: "Cảnh báo" },
    { value: "delete", label: "Xóa tin" },
    { value: "restrict", label: "Hạn chế chat" },
    { value: "ban", label: "Ban khỏi nhóm" }
  ],
  restrict: [
    { value: "restrict", label: "Hạn chế chat" },
    { value: "warn", label: "Cảnh báo" },
    { value: "delete", label: "Xóa tin" },
    { value: "ban", label: "Ban khỏi nhóm" }
  ],
  ban: [
    { value: "ban", label: "Ban khỏi nhóm" },
    { value: "warn", label: "Cảnh báo" },
    { value: "delete", label: "Xóa tin" },
    { value: "restrict", label: "Hạn chế chat" }
  ]
};
export const CONFIG_DEFAULT_VALUES: Record<string, string> = {
  emoji_spam_enabled: "true",
  emoji_spam_max_count: "5",
  moderation_enabled: "true",
  delete_system_messages: "true",
  delete_forwarded_messages: "true",
  allow_forward_messages: "true",
  allow_automatic_forwards: "true",
  forward_allowed_sources: "channel_private, channel_public, group_private, group_public, user",
  delete_inline_keyboard_messages: "true",
  delete_messages_from_bots: "true",
  remove_unknown_bots: "true",
  exempt_admins: "true",
  spam_max_messages: "6",
  spam_window_seconds: "12",
  spam_action: "warn",
  spam_restrict_seconds: "300",
  forward_action: "warn",
  inline_keyboard_action: "warn",
  ban_after_warnings: "3",
  ban_seconds: "0",
  warning_text: "{mention} cảnh báo vi phạm: {reason}\nSố lần cảnh báo: {count}/{limit}\nVui lòng dừng lại để tránh bị khóa hoặc ban.",
  forward_warning_reason: "Không cho phép chia sẻ Story/forward/trích dẫn nội dung từ nguồn bên ngoài vào nhóm.",
  forward_warning_text: "{mention} bạn đang gửi nội dung chuyển tiếp từ nguồn ngoài.\nLý do: {reason}\nCảnh báo: {count}/{limit}\nTiếp tục vi phạm sẽ bị xử lý mạnh hơn.",
  spam_restrict_text: "{mention} đã bị tạm khóa chat vì vi phạm: {reason}\nNếu cần hỗ trợ, liên hệ admin và chờ mở lại quyền chat.",
  warning_notice_delete_seconds: "180",
  forward_warning_delete_seconds: "180",
  spam_notice_delete_seconds: "30",
  violation_delete_retry_seconds: "2",
  duplicate_message_enabled: "true",
  duplicate_message_max_count: "3",
  duplicate_message_window_seconds: "600",
  duplicate_message_action: "warn",
  duplicate_message_reason: "Không gửi lặp lại cùng một nội dung hoặc sticker.",
  media_spam_max_messages: "3",
  media_spam_window_seconds: "10",
  media_spam_action: "restrict",
  scan_bio_links: "true",
  bio_link_delete_message: "true",
  bio_link_restrict_seconds: "0",
  bio_scan_cache_seconds: "3600",
  bio_link_warning_text: "{mention} bio của bạn đang chứa link.\nVui lòng gỡ link trong bio rồi nhắn admin để được mở chat lại.",
  bio_link_notice_delete_seconds: "60",
  giveaway_created_text: "Đã tạo giveaway #{id}.\nTên: {title}\nPhần thưởng: {prize}\nNgười dùng tham gia bằng lệnh /join {id} hoặc bấm nút tham gia bên dưới.",
  giveaway_empty_text: "Hiện chưa có giveaway nào đang mở. Admin có thể tạo giveaway mới bất cứ lúc nào.",
  giveaway_list_title: "Danh sách giveaway đang mở:",
  giveaway_join_usage_text: "Gửi theo cú pháp: /join <giveaway_id>\nNếu campaign yêu cầu từ khóa, thêm từ khóa ở cuối lệnh.",
  giveaway_not_found_open_text: "Không tìm thấy giveaway đang mở theo ID bạn vừa nhập.",
  giveaway_keyword_required_text: "Giveaway này yêu cầu từ khóa. Hãy gửi: /join {id} {keyword}",
  giveaway_joined_text: "Đã ghi nhận bạn tham gia giveaway #{id}.\nMã lượt tham gia: {entry_id}",
  giveaway_join_duplicate_text: "Bạn đã tham gia giveaway này rồi hoặc dữ liệu tham gia chưa hợp lệ.",
  giveaway_draw_usage_text: "Admin dùng lệnh: /draw <giveaway_id> để quay người thắng.",
  giveaway_not_found_text: "Không tìm thấy giveaway theo ID vừa nhập.",
  giveaway_no_entries_text: "Giveaway này chưa có người tham gia, chưa thể quay kết quả.",
  giveaway_result_text: "Kết quả giveaway #{id}:\n{winners}",
  giveaway_close_usage_text: "Admin dùng lệnh: /closegiveaway <giveaway_id> để đóng giveaway.",
  giveaway_closed_text: "Đã đóng giveaway #{id} thành công.",
};
export const ADVANCED_FIELD_KEYS = new Set(["id", "created_at", "updated_at", "settings"]);
export const GROUP_TAB_ORDER = ["Thông tin", "Bảo vệ group", "Luật spam", "Tin bot gửi", "Bio/link", "Lịch gửi", "Video", "Menu riêng", "Nội dung riêng", "Ghi chú", "Kỹ thuật"];
export const GROUP_BASE_SECTIONS = new Set(["Thông tin nhóm", "Thông tin", "Ghi chú", "Advanced"]);
export const GROUP_MODULE_SECTIONS: Record<string, Set<string>> = {
  moderation: new Set(["Thông tin nhóm", "Thông tin", "Ghi chú", "Advanced"]),
  automation: new Set(["Thông tin nhóm", "Thông tin", "Lịch gửi tin", "Video", "Ghi chú", "Advanced"]),
  menu_policy: new Set(["Thông tin nhóm", "Thông tin", "Menu bot", "Nội dung", "Ghi chú", "Advanced"])
};
export const GROUP_TAB_LABELS: Record<string, string> = {
  "Thông tin nhóm": "Thông tin",
  "Thông tin": "Thông tin",
  "Kiểm duyệt": "Bảo vệ group",
  "Luật spam": "Luật spam",
  "Mẫu tin kiểm duyệt": "Tin bot gửi",
  "Bio, link & cảnh báo": "Bio/link",
  "Lịch gửi tin": "Lịch gửi",
  Video: "Video",
  "Menu bot": "Menu riêng",
  "Nội dung": "Nội dung riêng",
  "Ghi chú": "Ghi chú",
  Advanced: "Kỹ thuật"
};
export const SCHEDULE_STEPS = [
  { title: "Chọn group", desc: "Xác định group/kênh sẽ nhận tin định kỳ." },
  { title: "Chọn pool", desc: "Gán message_pool hoặc video_pool đang có nội dung." },
  { title: "Preview nội dung", desc: "Xem trước vài tin/video bot có thể gửi." },
  { title: "Đặt giờ", desc: "Lưu daily/video window trên cấu hình group." }
];
export const bulkTables = new Set(["messages", "keywords", "video_messages", "scam_entities", "domain_blacklist", "link_shorteners", "auto_replies"]);
export const NAV_GROUPS = [
  { label: "Tổng quan", keys: ["bot_metrics", "audit_logs"] },
  { label: "Bot & nhóm", keys: ["bots", "groups", "module_settings", "admins", "member_roles"] },
  { label: "Bảo mật", keys: ["verification_settings", "captcha_questions", "keywords", "domain_blacklist", "link_shorteners", "bot_allowlist"] },
  { label: "Nội dung", keys: ["messages", "video_messages", "channel_posts", "auto_replies", "scheduled_posts"] },
  { label: "Scam", keys: ["scam_entities", "scam_reports"] },
  { label: "Giải trí", keys: ["entertainment_events", "giveaway_campaigns", "giveaway_entries", "share_unlock_campaigns", "share_unlock_invites", "share_unlock_referrals", "reputation_rules"] }
];
export const CORE_LAYERS = [
  {
    key: "overview",
    title: "Việc cần xử lý",
    shortTitle: "Tổng quan",
    desc: "Bắt đầu từ cảnh báo, việc còn thiếu và hành động cần hoàn tất hôm nay.",
    icon: ClipboardList,
    tone: "main",
    tables: ["bot_metrics", "audit_logs"],
    navSection: "Tổng quan"
  },
  {
    key: "bot",
    title: "Bot",
    shortTitle: "Bot",
    desc: "Kết nối bot, kiểm tra trạng thái và hoàn tất các điều kiện để bot bắt đầu vận hành.",
    icon: Bot,
    tone: "content",
    tables: ["bots", "module_settings"],
    navSection: "Vận hành"
  },
  {
    key: "group",
    title: "Group",
    shortTitle: "Group",
    desc: "Quản lý group/channel bot đang phục vụ, quyền truy cập và người có vai trò vận hành.",
    icon: Users,
    tone: "security",
    tables: ["groups", "bot_allowlist", "admins", "member_roles"],
    navSection: "Vận hành"
  },
  {
    key: "modules",
    title: "Module",
    shortTitle: "Module",
    desc: "Bật chức năng và mở workbench riêng cho từng module.",
    icon: Sparkles,
    tone: "content",
    tables: ["module_settings"],
    navSection: "Vận hành"
  },
  {
    key: "logs",
    title: "Logs",
    shortTitle: "Logs",
    desc: "Sự cố và kiểm duyệt.",
    icon: Activity,
    tone: "main",
    tables: ["audit_logs", "scam_reports"],
    navSection: "Vận hành"
  },
  {
    key: "analytics",
    title: "Thống kê",
    shortTitle: "Thống kê",
    desc: "Dashboard sức khỏe, join/out, active member và chỉ số kiểm duyệt.",
    icon: BarChart3,
    tone: "main",
    tables: ["bot_metrics", "audit_logs"],
    navSection: "Vận hành"
  },
  {
    key: "members",
    title: "Thành viên",
    shortTitle: "Thành viên",
    desc: "Phân quyền admin, role member, VIP, restricted và nhật ký join/out.",
    icon: Users,
    tone: "security",
    tables: ["audit_logs", "member_roles", "admins"],
    navSection: "Vận hành"
  },
  {
    key: "blacklist",
    title: "Blacklist hệ thống",
    shortTitle: "Blacklist",
    desc: "Danh sách chặn cực mạnh áp dụng toàn bộ hệ thống và tất cả bot.",
    icon: ShieldCheck,
    tone: "security",
    tables: ["audit_logs"],
    navSection: "Vận hành",
    landingKey: "audit_logs"
  }
];
export const SYSTEM_LAYERS = [
  {
    key: "advanced",
    title: "Dữ liệu kỹ thuật",
    shortTitle: "Dữ liệu kỹ thuật",
    desc: "Tra cứu và sửa dữ liệu thô khi cần xử lý ngoại lệ. Không dùng cho vận hành hằng ngày.",
    icon: Wrench,
    tone: "content",
    tables: NAV_GROUPS.flatMap((group) => group.keys),
    navSection: "Nâng cao"
  }
];
export const TABLE_GUIDES: Record<string, { title: string; body: string; steps: string[] }> = {
  groups: {
    title: "Group trong kiểm duyệt",
    body: "Group là nơi bot áp dụng luật kiểm duyệt, chống spam, xóa tin vi phạm, bio/link và quyền xử lý thành viên.",
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
    body: "Rule từ khóa sẽ xóa tin vi phạm trước. Nếu action là delete thì bot vẫn cộng cảnh báo nội bộ, đủ ngưỡng ban_after_warnings sẽ tự ban.",
    steps: ["delete = xóa tin + cộng cảnh báo", "ban_after_warnings quyết định khi nào ban", "regex cho mẫu nâng cao"]
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
export const COMMAND_OPTIONS = ["start", "help", "policy", "reload", "checkbio", "debuggroup", "warn", "ban", "unban", "giveaway", "giveaways", "join", "draw", "shareunlock", "shareprogress", "check", "report"];
export const CP_STATE_STORAGE_KEY = "cu_bot_cp_state";
export const CONFIG_LABELS: Record<string, string> = {
  moderation_enabled: "Bật kiểm duyệt",
  policy_text: "Nội quy nhóm",
  scam_review_channel_id: "Channel duyệt báo cáo scam",
  scam_review_group_id: "Group review scam",
  delete_system_messages: "Xóa tin hệ thống",
  delete_forwarded_messages: "Chặn tin forward",
  allow_forward_messages: "Cho phép forward",
  forward_allowed_sources: "Nguồn forward được phép",
  scan_hidden_links: "Quét link ẩn",
  scan_text_link: "Chặn text link",
  scan_text_mention: "Chặn text mention",
  allow_in_group_mentions: "Cho phép @user trong group",
  hidden_link_action: "Cách xử lý link ẩn",
  text_link_action: "Cách xử lý text link",
  text_mention_action: "Cách xử lý text mention",
  hidden_link_reason: "Lý do link ẩn",
  hidden_link_delete_notice_seconds: "Tự xóa thông báo link ẩn",
  allow_automatic_forwards: "Cho phép forward tự động",
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
  forward_allowed_content_types: "Loại nội dung forward được phép",
  forward_spam_max_messages: "Số forward tối đa",
  forward_spam_window_seconds: "Khung thời gian forward",
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
  forward_violation_restrict_after: "Restrict sau số vi phạm forward",
  forward_violation_ban_after: "Ban sau số vi phạm forward",
  media_spam_max_messages: "Số media spam tối đa",
  media_spam_window_seconds: "Khung thời gian media spam",
  media_spam_action: "Xử lý media spam",
  duplicate_message_enabled: "Chặn tin/sticker lặp lại",
  emoji_spam_enabled: "Chặn spam nhiều emoji",
  emoji_spam_max_count: "Số emoji tối đa trong một tin",
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
  scam_review_channel_text: "Mẫu tin gửi channel/group duyệt scam",
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
export const CONFIG_SECTIONS = [
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
    keys: ["moderation_enabled", "delete_system_messages", "allow_automatic_forwards", "delete_inline_keyboard_messages", "delete_messages_from_bots", "remove_unknown_bots", "exempt_admins"]
  },
  {
    title: "Forward nâng cao",
    desc: "Cho phép forward có kiểm soát, lọc theo nguồn, loại nội dung và ngưỡng vi phạm riêng.",
    icon: Send,
    tone: "security",
    keys: ["allow_forward_messages", "forward_allowed_sources", "forward_allowed_content_types", "forward_spam_max_messages", "forward_spam_window_seconds", "forward_violation_restrict_after", "forward_violation_ban_after", "forward_action", "forward_warning_reason", "forward_warning_text", "forward_warning_delete_seconds"]
  },
  {
    title: "Spam, cảnh báo & ban",
    desc: "Quy định bot sẽ warn, mute, kick hoặc ban thế nào khi phát hiện spam/vi phạm.",
    icon: SlidersHorizontal,
    tone: "security",
    keys: ["emoji_spam_enabled", "emoji_spam_max_count", "delete_inline_keyboard_messages", "spam_max_messages", "spam_window_seconds", "spam_action", "spam_restrict_seconds", "inline_keyboard_action", "ban_after_warnings", "ban_seconds", "duplicate_message_enabled", "duplicate_message_max_count", "duplicate_message_window_seconds", "duplicate_message_action", "duplicate_message_reason", "media_spam_max_messages", "media_spam_window_seconds", "media_spam_action", "violation_delete_retry_seconds"]
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
    keys: ["scan_bio_links", "bio_link_delete_message", "bio_link_restrict_seconds", "bio_scan_cache_seconds", "scan_hidden_links", "scan_text_link", "scan_text_mention", "allow_in_group_mentions", "hidden_link_action", "text_link_action", "text_mention_action", "hidden_link_reason", "hidden_link_delete_notice_seconds", "bio_link_warning_text", "bio_link_notice_delete_seconds"]
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
    keys: ["scam_review_channel_id", "scam_review_group_id", "admin_only_text", "check_usage_text", "check_not_found_text", "check_result_title", "report_usage_text", "report_received_text", "addscam_usage_text", "addscam_success_text", "scam_review_channel_text", "scam_report_pending_text", "scam_report_confirmed_text", "scam_check_safe_text", "scam_check_found_text"]
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
export const MODULE_HUBS = [
  {
    key: "moderation",
    moduleKeys: ["moderation"],
    title: "Kiểm duyệt tự động",
    desc: "Chống spam, quảng cáo, ban, xóa tin hệ thống, quét bio link và link xấu.",
    icon: ShieldCheck,
    tone: "security",
    tables: ["groups", "keywords", "domain_blacklist", "link_shorteners", "bot_allowlist", "config"],
    configKeys: ["emoji_spam_enabled", "emoji_spam_max_count", "moderation_enabled", "delete_system_messages", "allow_automatic_forwards", "delete_inline_keyboard_messages", "delete_messages_from_bots", "remove_unknown_bots", "exempt_admins", "allow_forward_messages", "forward_allowed_sources", "forward_allowed_content_types", "forward_spam_max_messages", "forward_spam_window_seconds", "forward_violation_restrict_after", "forward_violation_ban_after", "spam_max_messages", "spam_window_seconds", "spam_action", "spam_restrict_seconds", "forward_action", "inline_keyboard_action", "ban_after_warnings", "ban_seconds", "warning_text", "forward_warning_reason", "forward_warning_text", "spam_restrict_text", "warning_notice_delete_seconds", "forward_warning_delete_seconds", "spam_notice_delete_seconds", "violation_delete_retry_seconds", "duplicate_message_enabled", "duplicate_message_max_count", "duplicate_message_window_seconds", "duplicate_message_action", "duplicate_message_reason", "media_spam_max_messages", "media_spam_window_seconds", "media_spam_action", "scan_bio_links", "bio_link_delete_message", "bio_link_restrict_seconds", "bio_scan_cache_seconds", "bio_link_warning_text", "bio_link_notice_delete_seconds", "scan_hidden_links", "scan_text_link", "scan_text_mention", "allow_in_group_mentions", "hidden_link_action", "text_link_action", "text_mention_action", "hidden_link_reason", "hidden_link_delete_notice_seconds"]
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
    tables: ["groups", "messages", "video_messages", "channel_posts", "config"],
    configKeys: ["send_on_boot", "send_if_silent"]
  },
  {
    key: "welcome",
    moduleKeys: ["welcome"],
    title: "Welcome",
    desc: "Chào thành viên mới khi họ join group, có mẫu tin và tự xóa.",
    icon: MessageSquare,
    tone: "content",
    tables: ["module_settings"]
  },
  {
    key: "channel_publisher",
    moduleKeys: ["channel_publisher"],
    title: "Đăng channel",
    desc: "Soạn bài có nút inline rồi để bot gửi lên channel/group.",
    icon: MessageSquare,
    tone: "content",
    tables: ["channel_posts"]
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
    configKeys: ["scam_review_channel_id", "scam_review_group_id", "admin_only_text", "check_usage_text", "check_not_found_text", "check_result_title", "report_usage_text", "report_received_text", "addscam_usage_text", "addscam_success_text", "scam_review_channel_text", "scam_report_pending_text", "scam_report_confirmed_text", "scam_check_safe_text", "scam_check_found_text"]
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
    key: "share_unlock",
    moduleKeys: ["share_unlock"],
    title: "Mở khóa bằng chia sẻ",
    desc: "Mỗi user có link mời riêng. Đủ số người vào group qua link đó thì bot mở khóa link thưởng.",
    icon: Gift,
    tone: "fun",
    tables: ["share_unlock_campaigns", "share_unlock_invites", "share_unlock_referrals"],
  }
];
export const MODULE_TABLE_OWNER: Record<string, string> = {
  keywords: "moderation",
  domain_blacklist: "moderation",
  link_shorteners: "moderation",
  bot_allowlist: "moderation",
  verification_settings: "verification",
  captcha_questions: "verification",
  scheduled_posts: "automation",
  channel_posts: "channel_publisher",
  messages: "automation",
  video_messages: "automation",
  auto_replies: "auto_reply",
  scam_entities: "anti_scam",
  scam_reports: "anti_scam",
  giveaway_campaigns: "entertainment",
  giveaway_entries: "entertainment",
  entertainment_events: "entertainment",
  reputation_rules: "entertainment",
  share_unlock_campaigns: "share_unlock",
  share_unlock_invites: "share_unlock",
  share_unlock_referrals: "share_unlock",
  bot_metrics: "analytics",
  audit_logs: "analytics",
  admins: "members",
  member_roles: "members"
};
export const MODULES_REQUIRE_EXPLICIT_ENABLE = new Set(["auto_reply", "welcome", "share_unlock"]);
export const MODULE_CONFIG_KEYS = new Set(MODULE_HUBS.flatMap((module) => module.configKeys || []));
export const SYSTEM_CONFIG_SECTIONS = [
  {
    title: "Cài đặt dùng chung",
    desc: "Chỉ hiện các key thật sự chia sẻ toàn bot. Nếu một field cần chỉnh theo module hoặc theo group, nó sẽ không nằm ở đây.",
    icon: SlidersHorizontal,
    tone: "main",
    keys: [] as string[]
  }
];
export const CONFIG_DESCRIPTIONS: Record<string, string> = {
  moderation_enabled: "Bật/tắt toàn bộ luật kiểm duyệt cho module moderation.",
  policy_text: "Nội quy gửi kèm khi thành viên bấm nút Quy định hoặc gọi lệnh liên quan.",
  show_policy_button: "Bật/tắt nút Quy định xuất hiện dưới tin nhắn /start.",
  policy_button_text: "Tên hiển thị của nút Quy định trong Telegram.",
  bot_menu_commands: "Các lệnh chính bot đăng ký cho menu Telegram.",
  help_menu_commands: "Các lệnh hiển thị trong nội dung /help.",
  help_menu_title: "Dòng tiêu đề nằm phía trên danh sách lệnh khi user gọi /help.",
  start_fallback_text: "Tin nhắn dự phòng khi /start không có nội dung riêng.",
  delete_system_messages: "Tự xóa tin join/leave/pin và các tin hệ thống.",
  delete_forwarded_messages: "Chặn tin nhắn forward từ nơi khác.",
  scan_hidden_links: "Bật/tắt quét toàn bộ link ẩn trong message.",
  scan_text_link: "Bật/tắt quét link ẩn gắn vào chữ bấm.",
  scan_text_mention: "Bật/tắt quét mention gắn ẩn.",
  allow_in_group_mentions: "Cho phép @user giữa thành viên trong group.",
  hidden_link_action: "Chọn hành động khi bot gặp link ẩn.",
  text_link_action: "Chọn hành động khi bot gặp text link.",
  text_mention_action: "Chọn hành động khi bot gặp text mention.",
  hidden_link_reason: "Lý do nội bộ gắn vào audit cho link ẩn hoặc mention ngoài scope.",
  hidden_link_delete_notice_seconds: "Sau bao lâu bot tự xóa thông báo link ẩn.",
  allow_automatic_forwards: "Cho phép giữ lại tin auto-forward từ channel liên kết vào group.",
  delete_inline_keyboard_messages: "Chặn nút inline và nút trong Rich Message. Rich Message có nút: xóa tin và ban vĩnh viễn người gửi.",
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
  media_spam_max_messages: "Số tin media (ảnh/video/sticker) tối đa trong một khung thời gian trước khi xử lý.",
  media_spam_window_seconds: "Khung thời gian tính media spam, đơn vị giây.",
  media_spam_action: "Hành động khi user spam media: delete/warn/restrict/ban.",
  duplicate_message_enabled: "Bật để bot phát hiện user gửi cùng một tin nhắn hoặc cùng một sticker nhiều lần.",
  emoji_spam_enabled: "Xóa tin thường, forward và caption vượt ngưỡng emoji; kiểm tra cả tin chỉnh sửa. Giữ miễn trừ admin hiện có.",
  emoji_spam_max_count: "Mặc định 5: từ 6 emoji sẽ bị xóa. Emoji lặp tính từng lần; emoji ghép tính một. 0 chặn mọi tin có emoji.",
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
  scam_review_group_id: "Group review scam nội bộ, nơi admin có thể duyệt bằng lệnh và lưu ảnh/text report.",
  admin_only_text: "Bot gửi câu này khi người không phải admin dùng lệnh quản trị.",
  check_usage_text: "Hướng dẫn user tra cứu scam bằng UID, username, số tài khoản hoặc số điện thoại.",
  check_not_found_text: "Tin trả về khi /check không tìm thấy dữ liệu scam.",
  check_result_title: "Tiêu đề đầu kết quả khi /check tìm thấy dữ liệu.",
  report_usage_text: "Hướng dẫn user gửi báo cáo scam qua /report.",
  report_received_text: "Tin xác nhận bot đã nhận report và lưu vào database.",
  addscam_usage_text: "Hướng dẫn admin thêm dữ liệu scam bằng /addscam.",
  addscam_success_text: "Tin xác nhận đã thêm một đối tượng scam vào database.",
  scam_review_channel_text: "Mẫu nội dung bot gửi sang channel/group duyệt scam để admin kiểm tra.",
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
export const defaultBulkDefaults: BulkDefaults = {
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

