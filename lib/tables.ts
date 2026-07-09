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
      { key: "group_id", label: "Group/Channel ID", type: "text", required: true, placeholder: "-1001234567890 hoặc @channel_username", section: "Thông tin nhóm", helper: "Nhập ID thật của group/kênh. Group private thường có dạng -100..., channel public có thể dùng @username." },
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
      { key: "welcome_enabled", label: "Bật Welcome", type: "boolean", section: "Welcome" },
      { key: "welcome_text", label: "Tin welcome", type: "textarea", section: "Welcome" },
      { key: "welcome_buttons_text", label: "Nút inline", type: "textarea", section: "Welcome" },
      { key: "welcome_delete_seconds", label: "Xóa welcome sau", type: "number", section: "Welcome" },
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
      { key: "uid", label: "UID", type: "text", section: "Đối tượng", placeholder: "123456789", helper: "Nhập UID Telegram nếu có. Có thể để trống nếu chỉ có bank/username." },
      { key: "username", label: "Username", type: "text", section: "Đối tượng", placeholder: "@scammer_name", helper: "Username Telegram hoặc alias thường dùng." },
      { key: "bank_account", label: "Số tài khoản", type: "text", section: "Đối tượng", placeholder: "0123456789", helper: "Chỉ giữ số và ký tự cần thiết để dễ tìm kiếm." },
      { key: "phone", label: "Số điện thoại", type: "text", section: "Đối tượng", placeholder: "0987654321" },
      { key: "name", label: "Tên", type: "text", section: "Đối tượng", placeholder: "Nguyễn Văn A" },
      { key: "risk_level", label: "Mức rủi ro", type: "select", options: ["watch", "suspicious", "scam", "danger"], section: "Kết luận", helper: "watch = theo dõi, suspicious = đáng nghi, scam = xác nhận scam, danger = mức rất cao." },
      { key: "reason", label: "Lý do", type: "textarea", section: "Kết luận", placeholder: "Ví dụ: đã nhận tiền nhưng không giao hàng." },
      { key: "evidence", label: "Bằng chứng", type: "textarea", section: "Kết luận", placeholder: "Link ảnh, text note, bill, source report..." },
      { key: "source", label: "Nguồn", type: "text", section: "Kết luận", placeholder: "report/telegram/group name" },
      { key: "status", label: "Trạng thái", type: "select", options: ["pending", "confirmed", "rejected"], section: "Kết luận", helper: "pending = chờ duyệt, confirmed = đã đưa vào dữ liệu, rejected = bỏ qua." },
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
      { key: "reporter_user_id", label: "Người báo cáo", type: "text", section: "Báo cáo", placeholder: "123456789", helper: "ID Telegram của user gửi report." },
      { key: "reporter_username", label: "Username người báo cáo", type: "text", section: "Báo cáo", placeholder: "@reporter" },
      { key: "reporter_chat_id", label: "Chat ID người báo cáo", type: "text", section: "Báo cáo", helper: "Dùng để bot có thể nhắn follow-up khi cần bổ sung." },
      { key: "target_uid", label: "UID bị báo cáo", type: "text", section: "Đối tượng", placeholder: "123456789" },
      { key: "target_username", label: "Username bị báo cáo", type: "text", section: "Đối tượng", placeholder: "@scammer" },
      { key: "target_name", label: "Tên người scam", type: "text", section: "Đối tượng", placeholder: "Nguyễn Văn B" },
      { key: "group_name", label: "Tên group", type: "text", section: "Ngữ cảnh", placeholder: "Tên group nơi xảy ra scam" },
      { key: "admin_name", label: "Tên admin", type: "text", section: "Ngữ cảnh", placeholder: "Admin xử lý hoặc admin group" },
      { key: "bank_account", label: "Số tài khoản", type: "text", section: "Đối tượng", placeholder: "0123456789" },
      { key: "phone", label: "Số điện thoại", type: "text", section: "Đối tượng", placeholder: "0987654321" },
      { key: "evidence", label: "Bằng chứng", type: "textarea", section: "Bằng chứng", placeholder: "Nội dung bill, ảnh, mô tả ngắn..." },
      { key: "notes", label: "Ghi chú", type: "textarea", section: "Bằng chứng", placeholder: "Ghi chú bổ sung từ reporter hoặc admin." },
      { key: "status", label: "Trạng thái", type: "select", options: ["pending", "need_more_info", "duplicate", "confirmed", "rejected"], section: "Xử lý", helper: "need_more_info = chờ user bổ sung, duplicate = trùng report." },
      { key: "admin_note", label: "Ghi chú admin", type: "textarea", section: "Xử lý", placeholder: "Lý do duyệt hoặc phản hồi cho reporter." }
    ]
  },
  {
    key: "scam_broadcasts",
    label: "Broadcast scam",
    description: "Lịch sử broadcast scam đã gửi vào group/channel, dùng để theo dõi trạng thái và xử lý lỗi.",
    titleField: "headline",
    summaryFields: ["bot_key", "status", "broadcast_chat_id", "sent_at"],
    fields: [
      botKey,
      { key: "report_id", label: "Report ID", type: "text", section: "Nguồn" },
      { key: "entity_id", label: "Entity ID", type: "text", section: "Nguồn" },
      { key: "broadcast_chat_id", label: "Group/Channel đích", type: "text", required: true, section: "Đích broadcast", helper: "ID hoặc @username của group/channel nhận broadcast." },
      { key: "headline", label: "Tiêu đề", type: "text", required: true, section: "Nội dung" },
      { key: "message_text", label: "Nội dung", type: "textarea", required: true, section: "Nội dung" },
      { key: "attachment_url", label: "Ảnh/đính kèm", type: "text", section: "Nội dung", helper: "URL file hoặc Telegram file URL nếu có." },
      { key: "status", label: "Trạng thái", type: "select", options: ["queued", "sending", "sent", "failed", "skipped"], section: "Trạng thái" },
      { key: "sent_message_id", label: "Message ID gửi", type: "text", section: "Trạng thái" },
      { key: "sent_at", label: "Đã gửi lúc", type: "text", section: "Trạng thái" },
      { key: "error_message", label: "Lỗi", type: "textarea", section: "Trạng thái" },
      notes
    ]
  },
  {
    key: "keywords",
    label: "Từ khóa cấm",
    description: "Xóa tin vi phạm, cộng cảnh báo nội bộ và tự ban khi chạm ngưỡng.",
    titleField: "keyword",
    summaryFields: ["bot_key", "match", "action", "reason"],
    fields: [
      botKey,
      { key: "keyword", label: "Từ khóa", type: "text", required: true, section: "Rule" },
      { key: "match", label: "Kiểu khớp", type: "select", options: ["contains", "regex"], section: "Rule" },
      {
        key: "action",
        label: "Hành động",
        type: "select",
        options: ["delete", "warn", "mute", "kick", "ban"],
        section: "Rule",
        helper: "Delete = xóa tin + cộng cảnh báo nội bộ. Khi chạm ngưỡng Ban sau số cảnh báo ở phần kiểm duyệt, bot sẽ tự ban."
      },
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
      { key: "ignore_diacritics", label: "Bỏ dấu khi khớp", type: "boolean", section: "Auto reply", helper: "Bật nếu muốn rule khớp cả khi câu chat và trigger khác dấu." },
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
    key: "channel_posts",
    label: "Đăng channel",
    description: "Soạn bài có nút inline để bot gửi lên channel/group.",
    titleField: "title",
    summaryFields: ["bot_key", "target_chat_id", "status", "sent_message_id"],
    fields: [
      botKey,
      { key: "target_chat_id", label: "Channel/Group nhận bài", type: "text", required: true, section: "Bài đăng", helper: "Ví dụ: @hangcuvn hoặc -100... Bot phải là admin của channel/group." },
      { key: "title", label: "Tên nội bộ", type: "text", section: "Bài đăng", placeholder: "Ví dụ: Xác nhận tham gia" },
      { key: "content", label: "Nội dung gửi", type: "textarea", required: true, section: "Bài đăng", helper: "Hỗ trợ HTML theo parse mode của bot. Có thể dùng emoji, xuống dòng giống Telegram." },
      { key: "buttons_text", label: "Nút inline", type: "textarea", section: "Nút inline", helper: "Mỗi dòng là một hàng nút: Tên nút | https://link. Muốn 2 nút cùng hàng: Nút 1 | link || Nút 2 | link." },
      { key: "parse_mode", label: "Định dạng", type: "select", options: ["HTML", "Markdown", "MarkdownV2"], section: "Cài đặt gửi" },
      { key: "disable_web_page_preview", label: "Ẩn preview link", type: "boolean", section: "Cài đặt gửi" },
      { key: "status", label: "Trạng thái gửi", type: "select", options: ["draft", "scheduled", "queued", "sending", "sent", "delete_scheduled", "deleting", "deleted", "failed", "delete_failed", "cancelled"], section: "Cài đặt gửi" },
      { key: "scheduled_at", label: "Hẹn giờ gửi", type: "text", section: "Lịch gửi" },
      { key: "delete_at", label: "Hẹn giờ xóa", type: "text", section: "Lịch gửi" },
      { key: "sent_message_id", label: "Message ID đã gửi", type: "text", section: "Kết quả" },
      { key: "sent_at", label: "Đã gửi lúc", type: "text", section: "Kết quả" },
      { key: "deleted_at", label: "Đã xóa lúc", type: "text", section: "Kết quả" },
      { key: "updated_at", label: "Cập nhật lúc", type: "text", section: "Kỹ thuật" },
      { key: "attempt_count", label: "Số lần thử", type: "number", section: "Kỹ thuật" },
      { key: "last_attempt_at", label: "Lần thử gần nhất", type: "text", section: "Kỹ thuật" },
      { key: "created_by", label: "Người tạo", type: "text", section: "Kỹ thuật" },
      { key: "deleted_by", label: "Người xóa", type: "text", section: "Kỹ thuật" },
      { key: "error_code", label: "Mã lỗi", type: "text", section: "Kỹ thuật" },
      { key: "error", label: "Lỗi gửi", type: "textarea", section: "Kết quả" },
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
    key: "share_unlock_campaigns",
    label: "Mở khóa bằng mời bạn",
    description: "Campaign mời đủ N người qua link riêng để mở khóa một link/group khác.",
    titleField: "title",
    summaryFields: ["bot_key", "source_chat_id", "required_invites", "status"],
    fields: [
      botKey,
      { key: "source_chat_id", label: "Group nguồn", type: "text", required: true, section: "Campaign" },
      { key: "title", label: "Tên campaign", type: "text", required: true, section: "Campaign" },
      { key: "description", label: "Mô tả", type: "textarea", section: "Campaign" },
      { key: "required_invites", label: "Số người cần mời", type: "number", section: "Điều kiện" },
      { key: "unlock_target_type", label: "Loại mở khóa", type: "select", options: ["invite_link", "url", "message"], section: "Phần thưởng" },
      { key: "unlock_target_value", label: "Link/nội dung mở khóa", type: "textarea", required: true, section: "Phần thưởng" },
      { key: "share_message", label: "Tin nhắn hướng dẫn", type: "textarea", section: "Tin nhắn" },
      { key: "unlock_message", label: "Tin nhắn mở khóa", type: "textarea", section: "Tin nhắn" },
      { key: "status", label: "Trạng thái", type: "select", options: ["draft", "open", "closed"], section: "Campaign" },
      enabled,
      notes
    ]
  },
  {
    key: "share_unlock_invites",
    label: "Link mời cá nhân",
    description: "Mỗi user có một link mời riêng cho từng campaign.",
    titleField: "referrer_user_id",
    summaryFields: ["bot_key", "campaign_id", "referrer_user_id", "active"],
    fields: [
      botKey,
      { key: "campaign_id", label: "Campaign ID", type: "number", required: true, section: "Link" },
      { key: "referrer_user_id", label: "User giới thiệu", type: "text", required: true, section: "Link" },
      { key: "source_chat_id", label: "Group nguồn", type: "text", required: true, section: "Link" },
      { key: "invite_link", label: "Invite link", type: "textarea", required: true, section: "Link" },
      { key: "invite_name", label: "Tên link", type: "text", section: "Link" },
      { key: "active", label: "Kích hoạt", type: "boolean", section: "Trạng thái" },
      { key: "unlocked_at", label: "Mở khóa lúc", type: "text", section: "Trạng thái" },
      { key: "reward_sent_at", label: "Đã gửi thưởng lúc", type: "text", section: "Trạng thái" },
      { key: "reward_message_id", label: "Message ID thưởng", type: "text", section: "Trạng thái" }
    ]
  },
  {
    key: "share_unlock_referrals",
    label: "Lượt mời hợp lệ",
    description: "Danh sách user vào nhóm qua link cá nhân của người giới thiệu.",
    titleField: "invitee_user_id",
    summaryFields: ["bot_key", "campaign_id", "referrer_user_id", "invitee_user_id"],
    fields: [
      botKey,
      { key: "campaign_id", label: "Campaign ID", type: "number", required: true, section: "Referral" },
      { key: "referrer_user_id", label: "Người giới thiệu", type: "text", required: true, section: "Referral" },
      { key: "invitee_user_id", label: "Người được mời", type: "text", required: true, section: "Referral" },
      { key: "invitee_username", label: "Username", type: "text", section: "Referral" },
      { key: "invitee_chat_id", label: "Chat ID", type: "text", required: true, section: "Referral" },
      { key: "invite_link", label: "Invite link", type: "textarea", section: "Referral" },
      { key: "counted", label: "Được tính", type: "boolean", section: "Referral" }
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
  },
  {
    key: "analytics_daily_stats",
    label: "Snapshot thống kê ngày",
    description: "Cache thống kê theo ngày được rebuild từ audit_logs để dashboard tháng/năm chạy ổn định.",
    titleField: "stat_date",
    summaryFields: ["bot_key", "chat_id", "joins", "leaves", "violations"],
    fields: [
      botKey,
      { key: "chat_id", label: "Chat ID", type: "text" },
      { key: "stat_date", label: "Ngày", type: "text", required: true },
      { key: "joins", label: "Join", type: "number" },
      { key: "leaves", label: "Out", type: "number" },
      { key: "net_growth", label: "Tăng ròng", type: "number" },
      { key: "join_requests", label: "Yêu cầu vào", type: "number" },
      { key: "deleted_messages", label: "Tin đã xóa", type: "number" },
      { key: "delete_failures", label: "Xóa lỗi", type: "number" },
      { key: "warns", label: "Warn", type: "number" },
      { key: "restricts", label: "Cấm chat", type: "number" },
      { key: "bans", label: "Ban", type: "number" },
      { key: "kicks", label: "Kick", type: "number" },
      { key: "verified_members", label: "Verify OK", type: "number" },
      { key: "violations", label: "Vi phạm", type: "number" },
      { key: "unique_violators", label: "Người vi phạm", type: "number" },
      { key: "scam_reports", label: "Report scam", type: "number" },
      { key: "scam_pending", label: "Scam chờ", type: "number" },
      { key: "scam_confirmed", label: "Scam xác nhận", type: "number" },
      { key: "scam_rejected", label: "Scam từ chối", type: "number" },
      { key: "active_members", label: "Active members", type: "number" },
      { key: "member_count", label: "Tổng member", type: "number" },
      { key: "member_count_checked_at", label: "Lần kiểm member", type: "text" },
      { key: "payload", label: "Payload JSON", type: "textarea" }
    ]
  },
  {
    key: "analytics_member_activity",
    label: "Heartbeat thành viên",
    description: "Dấu vết active member theo ngày, dùng để đếm distinct active members.",
    titleField: "user_id",
    summaryFields: ["bot_key", "chat_id", "activity_date", "last_seen_at"],
    fields: [
      botKey,
      { key: "chat_id", label: "Chat ID", type: "text", required: true },
      { key: "user_id", label: "User ID", type: "text", required: true },
      { key: "activity_date", label: "Ngày active", type: "text", required: true },
      { key: "first_seen_at", label: "Lần đầu", type: "text" },
      { key: "last_seen_at", label: "Lần cuối", type: "text" },
      { key: "message_count", label: "Message count", type: "number" }
    ]
  }
];

export const TABLE_MAP: Record<string, TableConfig> = Object.fromEntries(TABLES.map((table) => [table.key, table]));
