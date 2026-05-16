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

export const TABLES: TableConfig[] = [
  {
    key: "groups",
    label: "Nhóm",
    description: "Quản lý group Telegram, chống spam và lịch gửi nội dung.",
    titleField: "group_name",
    summaryFields: ["group_id", "daily_enabled", "video_enabled", "spam_action"],
    fields: [
      { key: "group_id", label: "Group ID", type: "text", required: true, placeholder: "-100...", section: "Thông tin nhóm" },
      { key: "group_name", label: "Tên nhóm", type: "text", section: "Thông tin nhóm" },
      { key: "enabled", label: "Bật nhóm", type: "boolean", section: "Thông tin nhóm" },
      { key: "delete_system_messages", label: "Xóa tin hệ thống", type: "boolean", section: "Kiểm duyệt" },
      { key: "delete_forwarded_messages", label: "Chặn tin forward", type: "boolean", section: "Kiểm duyệt" },
      { key: "delete_inline_keyboard_messages", label: "Chặn bài có nút bấm", type: "boolean", section: "Kiểm duyệt" },
      { key: "delete_messages_from_bots", label: "Chặn bot lạ gửi tin", type: "boolean", section: "Kiểm duyệt" },
      { key: "remove_unknown_bots", label: "Tự kick bot lạ", type: "boolean", section: "Kiểm duyệt" },
      { key: "exempt_admins", label: "Bỏ qua admin", type: "boolean", section: "Kiểm duyệt" },
      { key: "spam_max_messages", label: "Số tin spam tối đa", type: "number", section: "Chống spam" },
      { key: "spam_window_seconds", label: "Khung thời gian spam", type: "number", section: "Chống spam" },
      { key: "spam_action", label: "Xử lý spam", type: "select", options: ["delete", "warn", "ban"], section: "Chống spam" },
      { key: "forward_action", label: "Xử lý forward", type: "select", options: ["delete", "warn", "ban"], section: "Chống spam" },
      { key: "inline_keyboard_action", label: "Xử lý bài có nút", type: "select", options: ["delete", "warn", "ban"], section: "Chống spam" },
      { key: "ban_after_warnings", label: "Ban sau số cảnh báo", type: "number", section: "Chống spam" },
      { key: "warning_text", label: "Mẫu cảnh báo", type: "textarea", section: "Chống spam" },
      { key: "daily_enabled", label: "Gửi tin hằng ngày", type: "boolean", section: "Lịch gửi tin" },
      { key: "daily_window_start", label: "Bắt đầu", type: "text", placeholder: "20:00", section: "Lịch gửi tin" },
      { key: "daily_window_end", label: "Kết thúc", type: "text", placeholder: "23:59", section: "Lịch gửi tin" },
      { key: "send_if_silent", label: "Gửi khi nhóm im lặng", type: "boolean", section: "Lịch gửi tin" },
      { key: "message_pool", label: "Nhóm nội dung", type: "text", section: "Lịch gửi tin" },
      { key: "video_enabled", label: "Gửi video", type: "boolean", section: "Video" },
      { key: "video_window_start", label: "Video bắt đầu", type: "text", section: "Video" },
      { key: "video_window_end", label: "Video kết thúc", type: "text", section: "Video" },
      { key: "video_pool", label: "Nhóm video", type: "text", section: "Video" },
      { key: "policy_text", label: "Nội quy riêng", type: "textarea", section: "Nội dung" },
      { key: "notes", label: "Ghi chú", type: "textarea", section: "Nội dung" }
    ]
  },
  {
    key: "config",
    label: "Cài đặt",
    description: "Các thiết lập mặc định dùng chung cho bot.",
    titleField: "key",
    summaryFields: ["value", "enabled"],
    fields: [
      { key: "key", label: "Mã cài đặt", type: "text", required: true },
      { key: "value", label: "Giá trị", type: "textarea" },
      { key: "enabled", label: "Trạng thái", type: "boolean" },
      { key: "notes", label: "Ghi chú", type: "textarea" }
    ]
  },
  {
    key: "messages",
    label: "Tin nhắn",
    description: "Nội dung bot gửi khi /start hoặc theo lịch.",
    titleField: "message",
    summaryFields: ["pool", "weight", "enabled"],
    fields: [
      { key: "message", label: "Nội dung", type: "textarea", required: true },
      { key: "pool", label: "Nhóm nội dung", type: "text" },
      { key: "weight", label: "Độ ưu tiên", type: "number" },
      { key: "enabled", label: "Trạng thái", type: "boolean" },
      { key: "notes", label: "Ghi chú", type: "textarea" }
    ]
  },
  {
    key: "keywords",
    label: "Từ khóa cấm",
    description: "Từ khóa cần xóa, cảnh báo hoặc ban.",
    titleField: "keyword",
    summaryFields: ["match", "action", "reason"],
    fields: [
      { key: "keyword", label: "Từ khóa", type: "text", required: true },
      { key: "match", label: "Kiểu khớp", type: "select", options: ["contains", "regex"] },
      { key: "action", label: "Hành động", type: "select", options: ["delete", "warn", "ban"] },
      { key: "reason", label: "Lý do", type: "text" },
      { key: "enabled", label: "Trạng thái", type: "boolean" },
      { key: "notes", label: "Ghi chú", type: "textarea" }
    ]
  },
  {
    key: "admins",
    label: "Quản trị viên",
    description: "User được phép dùng lệnh quản trị bot.",
    titleField: "user_id",
    summaryFields: ["chat_id", "enabled", "notes"],
    fields: [
      { key: "user_id", label: "User ID", type: "text", required: true },
      { key: "chat_id", label: "Chat ID", type: "text" },
      { key: "enabled", label: "Trạng thái", type: "boolean" },
      { key: "notes", label: "Ghi chú", type: "textarea" }
    ]
  },
  {
    key: "bot_allowlist",
    label: "Bot được phép",
    description: "Danh sách bot được phép tồn tại hoặc gửi tin.",
    titleField: "username",
    summaryFields: ["bot_id", "chat_id", "enabled"],
    fields: [
      { key: "bot_id", label: "Bot ID", type: "text" },
      { key: "username", label: "Username", type: "text" },
      { key: "chat_id", label: "Chat ID", type: "text" },
      { key: "enabled", label: "Trạng thái", type: "boolean" },
      { key: "notes", label: "Ghi chú", type: "textarea" }
    ]
  },
  {
    key: "video_messages",
    label: "Video",
    description: "Nguồn message video để bot copy ẩn danh.",
    titleField: "message_id",
    summaryFields: ["from_chat_id", "pool", "enabled"],
    fields: [
      { key: "from_chat_id", label: "Source chat ID", type: "text", required: true },
      { key: "message_id", label: "Message ID", type: "text", required: true },
      { key: "caption", label: "Caption", type: "textarea" },
      { key: "pool", label: "Nhóm video", type: "text" },
      { key: "weight", label: "Độ ưu tiên", type: "number" },
      { key: "enabled", label: "Trạng thái", type: "boolean" },
      { key: "notes", label: "Ghi chú", type: "textarea" }
    ]
  }
];

export const TABLE_MAP = Object.fromEntries(TABLES.map((table) => [table.key, table]));
