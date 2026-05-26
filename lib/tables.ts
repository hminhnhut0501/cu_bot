export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  section?: string;
  helper?: string;
};

export type TableConfig = {
  key: string;
  label: string;
  description: string;
  fields: FieldConfig[];
  titleField: string;
  summaryFields: string[];
};

const botKey: FieldConfig = { key: "bot_key", label: "Bot", type: "text", section: "Phạm vi", placeholder: "main" };
const enabled: FieldConfig = { key: "enabled", label: "Trạng thái", type: "boolean", section: "Phạm vi" };
const notes: FieldConfig = { key: "notes", label: "Ghi chú", type: "textarea", section: "Ghi chú" };

export const TABLES: TableConfig[] = [
  {
    key: "bots",
    label: "Bot",
    description: "Quản lý nhiều bot trong cùng một control panel.",
    titleField: "name",
    summaryFields: ["bot_key", "username", "status"],
    fields: [
      { key: "bot_key", label: "Mã bot", type: "text", required: true, section: "Thông tin bot" },
      { key: "name", label: "Tên bot", type: "text", required: true, section: "Thông tin bot" },
      { key: "username", label: "Username", type: "text", section: "Thông tin bot" },
      { key: "bot_token", label: "Token bot", type: "text", section: "Kết nối", helper: "Token lấy từ BotFather. Nếu Render không set BOT_TOKEN, service sẽ lấy token theo BOT_KEY từ đây." },
      { key: "status", label: "Trạng thái vận hành", type: "select", options: ["active", "paused", "archived"], section: "Thông tin bot" },
      { key: "owner_note", label: "Ghi chú chủ sở hữu", type: "textarea", section: "Thông tin bot" },
      enabled
    ]
  },
  {
    key: "module_settings",
    label: "Module",
    description: "Bật/tắt module và chỉnh mặc định của từng module. Các override theo group sẽ nằm ở bảng group.",
    titleField: "module_name",
    summaryFields: ["bot_key", "category", "module_key", "enabled"],
    fields: [
      botKey,
      { key: "module_key", label: "Mã module", type: "text", required: true, section: "Module" },
      { key: "module_name", label: "Tên module", type: "text", required: true, section: "Module" },
      { key: "category", label: "Nhóm chức năng", type: "select", options: ["Kiểm duyệt tự động", "Menu & nội quy", "Bảo mật & verify", "Tự động hóa", "Auto reply", "Chống scam", "Giải trí", "Thống kê", "Thành viên", "Hệ thống"], section: "Module" },
      { key: "settings", label: "Cấu hình JSON", type: "textarea", section: "Module", helper: "Có thể để {} nếu chưa cần cấu hình nâng cao." },
      enabled,
      notes
    ]
  },
  {
    key: "config",
    label: "Cài đặt",
    description: "Cài đặt dùng chung toàn bot/CP. Nếu một field có thể chỉnh theo module hoặc theo group, nó sẽ không ưu tiên đặt ở đây.",
    titleField: "key",
    summaryFields: ["bot_key", "value", "enabled"],
    fields: [botKey, { key: "key", label: "Mã cài đặt", type: "text", required: true }, { key: "value", label: "Giá trị", type: "textarea" }, enabled, notes]
  },
  {
    key: "groups",
    label: "Nhóm",
    description: "Phạm vi group/kênh bot quản lý: bật/tắt group, lịch gửi, menu riêng và nội dung riêng.",
    titleField: "group_name",
    summaryFields: ["bot_key", "group_id", "daily_enabled", "video_enabled"],
    fields: [
      botKey,
      { key: "group_id", label: "Group ID", type: "text", required: true, placeholder: "-100...", section: "Thông tin nhóm" },
      { key: "group_name", label: "Tên nhóm", type: "text", section: "Thông tin nhóm" },
      enabled,
      { key: "daily_enabled", label: "Gửi tin hằng ngày", type: "boolean", section: "Lịch gửi tin" },
      { key: "daily_window_start", label: "Bắt đầu", type: "text", placeholder: "20:00", section: "Lịch gửi tin" },
      { key: "daily_window_end", label: "Kết thúc", type: "text", placeholder: "23:59", section: "Lịch gửi tin" },
      { key: "send_if_silent", label: "Gửi khi nhóm im lặng", type: "boolean", section: "Lịch gửi tin" },
      { key: "message_pool", label: "Nhóm nội dung", type: "text", section: "Lịch gửi tin" },
      { key: "video_enabled", label: "Gửi video", type: "boolean", section: "Video" },
      { key: "video_window_start", label: "Video bắt đầu", type: "text", section: "Video" },
      { key: "video_window_end", label: "Video kết thúc", type: "text", section: "Video" },
      { key: "video_pool", label: "Nhóm video", type: "text", section: "Video" },
      { key: "show_policy_button", label: "Hiện nút Quy định", type: "boolean", section: "Menu bot" },
      { key: "policy_button_text", label: "Text nút Quy định", type: "text", section: "Menu bot" },
      { key: "help_menu_commands", label: "Lệnh hiện trong /help", type: "textarea", section: "Menu bot", helper: "Ví dụ: start,policy,reload,warn,ban. Để trống sẽ dùng cài đặt chung." },
      { key: "policy_text", label: "Nội quy riêng", type: "textarea", section: "Nội dung" },
      notes
    ]
  },
  {
    key: "admins",
    label: "Quản trị viên",
    description: "Phân quyền Owner, Mod, VIP, Member, Restricted cho từng bot/group.",
    titleField: "user_id",
    summaryFields: ["bot_key", "role", "chat_id", "enabled"],
    fields: [
      botKey,
      { key: "user_id", label: "User ID", type: "text", required: true, section: "Người dùng" },
      { key: "chat_id", label: "Chat ID", type: "text", section: "Người dùng" },
      { key: "role", label: "Role", type: "select", options: ["owner", "mod", "vip", "member", "restricted"], section: "Người dùng" },
      enabled,
      notes
    ]
  },
  {
    key: "member_roles",
    label: "Member",
    description: "Quản lý role, điểm reputation và trạng thái hạn chế của member.",
    titleField: "username",
    summaryFields: ["bot_key", "role", "reputation", "enabled"],
    fields: [
      botKey,
      { key: "user_id", label: "User ID", type: "text", required: true, section: "Member" },
      { key: "username", label: "Username", type: "text", section: "Member" },
      { key: "chat_id", label: "Chat ID", type: "text", section: "Member" },
      { key: "role", label: "Role", type: "select", options: ["owner", "mod", "vip", "member", "restricted"], section: "Member" },
      { key: "reputation", label: "Điểm", type: "number", section: "Reputation" },
      { key: "restricted_until", label: "Hạn chế đến", type: "text", section: "Reputation", helper: "ISO timestamp, có thể để trống." },
      enabled,
      notes
    ]
  },
  {
    key: "scam_entities",
    label: "Dữ liệu scam",
    description: "UID, username, số tài khoản, số điện thoại đã xác nhận là lừa đảo/scam.",
    titleField: "username",
    summaryFields: ["bot_key", "uid", "bank_account", "risk_level"],
    fields: [
      botKey,
      { key: "uid", label: "UID", type: "text", section: "Đối tượng" },
      { key: "username", label: "Username", type: "text", section: "Đối tượng" },
      { key: "bank_account", label: "Số tài khoản", type: "text", section: "Đối tượng" },
      { key: "phone", label: "Số điện thoại", type: "text", section: "Đối tượng" },
      { key: "name", label: "Tên", type: "text", section: "Đối tượng" },
      { key: "risk_level", label: "Mức rủi ro", type: "select", options: ["watch", "suspicious", "scam", "danger"], section: "Kết luận" },
      { key: "reason", label: "Lý do", type: "textarea", section: "Kết luận" },
      { key: "evidence", label: "Bằng chứng", type: "textarea", section: "Kết luận" },
      { key: "source", label: "Nguồn", type: "text", section: "Kết luận" },
      { key: "status", label: "Trạng thái", type: "select", options: ["pending", "confirmed", "rejected"], section: "Kết luận" },
      enabled
    ]
  },
  {
    key: "scam_reports",
    label: "Báo cáo scam",
    description: "Tin báo từ thành viên gửi riêng cho bot, chờ admin xác nhận.",
    titleField: "target_username",
    summaryFields: ["bot_key", "reporter_user_id", "bank_account", "status"],
    fields: [
      botKey,
      { key: "reporter_user_id", label: "Người báo cáo", type: "text", section: "Báo cáo" },
      { key: "reporter_username", label: "Username người báo cáo", type: "text", section: "Báo cáo" },
      { key: "target_uid", label: "UID bị báo cáo", type: "text", section: "Đối tượng" },
      { key: "target_username", label: "Username bị báo cáo", type: "text", section: "Đối tượng" },
      { key: "bank_account", label: "Số tài khoản", type: "text", section: "Đối tượng" },
      { key: "phone", label: "Số điện thoại", type: "text", section: "Đối tượng" },
      { key: "evidence", label: "Bằng chứng", type: "textarea", section: "Bằng chứng" },
      { key: "status", label: "Trạng thái", type: "select", options: ["pending", "confirmed", "rejected"], section: "Xử lý" },
      { key: "admin_note", label: "Ghi chú admin", type: "textarea", section: "Xử lý" }
    ]
  },
  {
    key: "keywords",
    label: "Từ khóa cấm",
    description: "Ban theo keyword, chống keyword cấm, NSFW/porn hoặc scam.",
    titleField: "keyword",
    summaryFields: ["bot_key", "match", "action", "reason"],
    fields: [
      botKey,
      { key: "keyword", label: "Từ khóa", type: "text", required: true, section: "Rule" },
      { key: "match", label: "Kiểu khớp", type: "select", options: ["contains", "regex"], section: "Rule" },
      { key: "action", label: "Hành động", type: "select", options: ["delete", "warn", "mute", "kick", "ban"], section: "Rule" },
      { key: "reason", label: "Lý do", type: "text", section: "Rule" },
      enabled,
      notes
    ]
  },
  {
    key: "domain_blacklist",
    label: "Domain blacklist",
    description: "Chống phishing, link scam, telegram clone và domain độc hại.",
    titleField: "domain",
    summaryFields: ["bot_key", "risk", "action", "enabled"],
    fields: [
      botKey,
      { key: "domain", label: "Domain", type: "text", required: true, section: "Domain" },
      { key: "risk", label: "Rủi ro", type: "select", options: ["phishing", "scam", "telegram_clone", "nsfw"], section: "Domain" },
      { key: "action", label: "Hành động", type: "select", options: ["delete", "warn", "ban"], section: "Domain" },
      enabled,
      notes
    ]
  },
  {
    key: "link_shorteners",
    label: "Link rút gọn",
    description: "Danh sách domain rút gọn cần cảnh báo hoặc chặn.",
    titleField: "domain",
    summaryFields: ["bot_key", "action", "enabled"],
    fields: [
      botKey,
      { key: "domain", label: "Domain", type: "text", required: true, section: "Domain" },
      { key: "action", label: "Hành động", type: "select", options: ["delete", "warn", "ban"], section: "Domain" },
      enabled,
      notes
    ]
  },
  {
    key: "verification_settings",
    label: "Verify",
    description: "Join captcha, math captcha, delay join và auto kick member không verify.",
    titleField: "chat_id",
    summaryFields: ["bot_key", "captcha_type", "verify_timeout_seconds", "enabled"],
    fields: [
      botKey,
      { key: "chat_id", label: "Chat ID", type: "text", section: "Verify" },
      { key: "captcha_type", label: "Loại captcha", type: "select", options: ["math", "image", "button"], section: "Verify" },
      { key: "verify_timeout_seconds", label: "Thời gian verify", type: "number", section: "Verify" },
      { key: "kick_unverified", label: "Kick nếu không verify", type: "boolean", section: "Verify" },
      { key: "delay_join_seconds", label: "Delay join chat", type: "number", section: "Verify" },
      enabled,
      notes
    ]
  },
  {
    key: "captcha_questions",
    label: "Captcha",
    description: "Câu hỏi captcha đơn giản, chủ yếu dùng cho math/button captcha.",
    titleField: "question",
    summaryFields: ["bot_key", "answer", "enabled"],
    fields: [botKey, { key: "question", label: "Câu hỏi", type: "text", required: true }, { key: "answer", label: "Đáp án", type: "text", required: true }, enabled, notes]
  },
  {
    key: "bot_allowlist",
    label: "Bot được phép",
    description: "Bot được phép tồn tại hoặc gửi tin trong group.",
    titleField: "username",
    summaryFields: ["bot_key", "bot_id", "chat_id", "enabled"],
    fields: [botKey, { key: "bot_id", label: "Bot ID", type: "text" }, { key: "username", label: "Username", type: "text" }, { key: "chat_id", label: "Chat ID", type: "text" }, enabled, notes]
  },
  {
    key: "auto_replies",
    label: "Auto reply",
    description: "Tự động trả lời các câu như giá, support, rule.",
    titleField: "trigger",
    summaryFields: ["bot_key", "match", "enabled"],
    fields: [
      botKey,
      { key: "trigger", label: "Câu kích hoạt", type: "text", required: true, section: "Auto reply", helper: "Ví dụ: gia, support, noiquy. Tránh trigger quá ngắn 1 ký tự." },
      { key: "match", label: "Cách hiểu câu kích hoạt", type: "select", options: ["smart", "exact", "contains", "regex"], section: "Auto reply", helper: "smart: hiểu theo từ/ngữ cảnh (khuyên dùng) · exact: trùng nguyên câu · contains: có chứa cụm từ · regex: nâng cao." },
      { key: "reply", label: "Nội dung trả lời", type: "textarea", required: true, section: "Auto reply", helper: "Có thể nhập nhiều mẫu và ngăn bằng || hoặc xuống dòng để bot trả lời ngẫu nhiên." },
      enabled,
      notes
    ]
  },
  {
    key: "messages",
    label: "Tin nhắn",
    description: "Nội dung bot gửi khi /start hoặc theo lịch.",
    titleField: "message",
    summaryFields: ["bot_key", "pool", "weight", "enabled"],
    fields: [botKey, { key: "message", label: "Nội dung", type: "textarea", required: true }, { key: "pool", label: "Nhóm nội dung", type: "text" }, { key: "weight", label: "Độ ưu tiên", type: "number" }, enabled, notes]
  },
  {
    key: "scheduled_posts",
    label: "Gửi tin hẹn giờ",
    description: "Tạo lịch để bot gửi nội dung vào đúng group và đúng giờ.",
    titleField: "title",
    summaryFields: ["bot_key", "chat_id", "schedule_text", "enabled"],
    fields: [
      botKey,
      { key: "chat_id", label: "Group/Kênh nhận tin", type: "text", required: true, section: "Lịch" },
      { key: "title", label: "Tiêu đề", type: "text", section: "Lịch" },
      { key: "content", label: "Nội dung bot sẽ gửi", type: "textarea", required: true, section: "Lịch" },
      { key: "schedule_text", label: "Giờ gửi", type: "text", section: "Lịch", helper: "Ví dụ: daily 09:00 để gửi mỗi ngày lúc 9 giờ sáng." },
      enabled,
      notes
    ]
  },
  {
    key: "video_messages",
    label: "Video",
    description: "Nguồn message video để bot copy ẩn danh.",
    titleField: "message_id",
    summaryFields: ["bot_key", "from_chat_id", "pool", "enabled"],
    fields: [botKey, { key: "from_chat_id", label: "Source chat ID", type: "text", required: true }, { key: "message_id", label: "Message ID", type: "text", required: true }, { key: "caption", label: "Caption", type: "textarea" }, { key: "pool", label: "Nhóm video", type: "text" }, { key: "weight", label: "Độ ưu tiên", type: "number" }, enabled, notes]
  },
  {
    key: "reputation_rules",
    label: "Điểm tương tác",
    description: "Quy tắc cộng điểm, rank và auto unlock quyền.",
    titleField: "action_key",
    summaryFields: ["bot_key", "points", "daily_limit", "enabled"],
    fields: [botKey, { key: "action_key", label: "Hành động", type: "text", required: true }, { key: "points", label: "Điểm", type: "number" }, { key: "daily_limit", label: "Giới hạn/ngày", type: "number" }, enabled, notes]
  },
  {
    key: "giveaway_campaigns",
    label: "Giveaway",
    description: "Tạo giveaway, quản lý phần thưởng, số người thắng và trạng thái quay số.",
    titleField: "title",
    summaryFields: ["bot_key", "chat_id", "status", "winner_count"],
    fields: [
      botKey,
      { key: "chat_id", label: "Chat ID", type: "text", required: true, section: "Giveaway" },
      { key: "title", label: "Tên giveaway", type: "text", required: true, section: "Giveaway" },
      { key: "prize", label: "Phần thưởng", type: "text", section: "Giveaway" },
      { key: "description", label: "Mô tả", type: "textarea", section: "Giveaway" },
      { key: "status", label: "Trạng thái", type: "select", options: ["draft", "open", "closed", "drawn"], section: "Giveaway" },
      { key: "winner_count", label: "Số người thắng", type: "number", section: "Quay số" },
      { key: "require_keyword", label: "Từ khóa bắt buộc", type: "text", section: "Quay số", helper: "Có thể để trống." },
      { key: "start_at", label: "Bắt đầu", type: "text", section: "Thời gian" },
      { key: "end_at", label: "Kết thúc", type: "text", section: "Thời gian" },
      { key: "winners", label: "Người thắng", type: "textarea", section: "Kết quả" },
      enabled,
      notes
    ]
  },
  {
    key: "giveaway_entries",
    label: "Lượt tham gia",
    description: "Danh sách member đã tham gia giveaway.",
    titleField: "display_name",
    summaryFields: ["bot_key", "giveaway_id", "user_id", "created_at"],
    fields: [
      botKey,
      { key: "giveaway_id", label: "Giveaway ID", type: "number", required: true },
      { key: "chat_id", label: "Chat ID", type: "text", required: true },
      { key: "user_id", label: "User ID", type: "text", required: true },
      { key: "username", label: "Username", type: "text" },
      { key: "display_name", label: "Tên hiển thị", type: "text" },
      { key: "entry_note", label: "Ghi chú", type: "textarea" }
    ]
  },
  {
    key: "entertainment_events",
    label: "Giải trí",
    description: "Module con: giveaway, bình chọn, check-in, mini quiz, số may mắn, leaderboard.",
    titleField: "event_name",
    summaryFields: ["bot_key", "event_type", "enabled"],
    fields: [
      botKey,
      { key: "event_key", label: "Mã event", type: "text", required: true },
      { key: "event_name", label: "Tên event", type: "text", required: true },
      { key: "event_type", label: "Loại", type: "select", options: ["giveaway", "poll_event", "checkin_streak", "mini_quiz", "lucky_number", "leaderboard", "custom"] },
      { key: "chat_id", label: "Chat ID", type: "text" },
      { key: "config", label: "Cấu hình JSON", type: "textarea", helper: "Ví dụ: {\"points\":2}" },
      enabled,
      notes
    ]
  },
  {
    key: "audit_logs",
    label: "Nhật ký",
    description: "Ai xóa tin, ai ban member, ai sửa quyền, các hành động vận hành.",
    titleField: "action",
    summaryFields: ["bot_key", "actor_user_id", "target_user_id", "created_at"],
    fields: [botKey, { key: "chat_id", label: "Chat ID", type: "text" }, { key: "actor_user_id", label: "Người thực hiện", type: "text" }, { key: "action", label: "Hành động", type: "text", required: true }, { key: "target_user_id", label: "Đối tượng", type: "text" }, { key: "details", label: "Chi tiết", type: "textarea" }]
  },
  {
    key: "bot_metrics",
    label: "Thống kê",
    description: "Các chỉ số dashboard: member, active, spam, tin đã xóa, scam report, verify.",
    titleField: "metric_key",
    summaryFields: ["bot_key", "metric_value", "period", "updated_at"],
    fields: [
      botKey,
      { key: "metric_key", label: "Mã chỉ số", type: "text", required: true },
      { key: "metric_value", label: "Giá trị", type: "number" },
      { key: "period", label: "Kỳ", type: "select", options: ["today", "week", "month", "all_time"] },
      notes
    ]
  }
];

export const TABLE_MAP: Record<string, TableConfig> = Object.fromEntries(TABLES.map((table) => [table.key, table]));
