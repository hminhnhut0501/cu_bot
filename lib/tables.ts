export type FieldType = "text" | "textarea" | "number" | "boolean" | "select";

export type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type TableConfig = {
  key: string;
  label: string;
  description: string;
  fields: FieldConfig[];
  titleField: string;
};

export const TABLES: TableConfig[] = [
  {
    key: "groups",
    label: "Groups",
    description: "Cau hinh group Telegram va lich gui tin.",
    titleField: "group_name",
    fields: [
      { key: "group_id", label: "Group ID", type: "text", required: true, placeholder: "-100..." },
      { key: "group_name", label: "Ten group", type: "text" },
      { key: "enabled", label: "Bat group", type: "boolean" },
      { key: "delete_system_messages", label: "Xoa tin he thong", type: "boolean" },
      { key: "delete_forwarded_messages", label: "Chan forward", type: "boolean" },
      { key: "delete_inline_keyboard_messages", label: "Chan nut bam", type: "boolean" },
      { key: "delete_messages_from_bots", label: "Chan bot la", type: "boolean" },
      { key: "remove_unknown_bots", label: "Kick bot la", type: "boolean" },
      { key: "exempt_admins", label: "Bo qua admin", type: "boolean" },
      { key: "spam_max_messages", label: "Spam max", type: "number" },
      { key: "spam_window_seconds", label: "Spam window", type: "number" },
      { key: "spam_action", label: "Spam action", type: "select", options: ["delete", "warn", "ban"] },
      { key: "forward_action", label: "Forward action", type: "select", options: ["delete", "warn", "ban"] },
      { key: "inline_keyboard_action", label: "Button action", type: "select", options: ["delete", "warn", "ban"] },
      { key: "ban_after_warnings", label: "Ban sau canh bao", type: "number" },
      { key: "warning_text", label: "Mau canh bao", type: "textarea" },
      { key: "daily_enabled", label: "Gui tin moi ngay", type: "boolean" },
      { key: "daily_window_start", label: "Gio bat dau", type: "text", placeholder: "20:00" },
      { key: "daily_window_end", label: "Gio ket thuc", type: "text", placeholder: "23:59" },
      { key: "send_if_silent", label: "Gui khi group im lang", type: "boolean" },
      { key: "message_pool", label: "Pool tin nhan", type: "text" },
      { key: "video_enabled", label: "Gui video", type: "boolean" },
      { key: "video_window_start", label: "Gio video bat dau", type: "text" },
      { key: "video_window_end", label: "Gio video ket thuc", type: "text" },
      { key: "video_pool", label: "Pool video", type: "text" },
      { key: "policy_text", label: "Noi quy rieng", type: "textarea" },
      { key: "notes", label: "Ghi chu", type: "textarea" }
    ]
  },
  {
    key: "config",
    label: "Config",
    description: "Cau hinh mac dinh dung chung cho bot.",
    titleField: "key",
    fields: [
      { key: "key", label: "Key", type: "text", required: true },
      { key: "value", label: "Value", type: "textarea" },
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "notes", label: "Ghi chu", type: "textarea" }
    ]
  },
  {
    key: "messages",
    label: "Messages",
    description: "Noi dung bot gui ngau nhien moi ngay hoac khi /start.",
    titleField: "message",
    fields: [
      { key: "message", label: "Noi dung", type: "textarea", required: true },
      { key: "pool", label: "Pool", type: "text" },
      { key: "weight", label: "Weight", type: "number" },
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "notes", label: "Ghi chu", type: "textarea" }
    ]
  },
  {
    key: "keywords",
    label: "Keywords",
    description: "Tu khoa cam va hanh dong xu ly.",
    titleField: "keyword",
    fields: [
      { key: "keyword", label: "Tu khoa", type: "text", required: true },
      { key: "match", label: "Match", type: "select", options: ["contains", "regex"] },
      { key: "action", label: "Action", type: "select", options: ["delete", "warn", "ban"] },
      { key: "reason", label: "Ly do", type: "text" },
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "notes", label: "Ghi chu", type: "textarea" }
    ]
  },
  {
    key: "admins",
    label: "Admins",
    description: "User duoc phep dung lenh quan tri.",
    titleField: "user_id",
    fields: [
      { key: "user_id", label: "User ID", type: "text", required: true },
      { key: "chat_id", label: "Chat ID", type: "text" },
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "notes", label: "Ghi chu", type: "textarea" }
    ]
  },
  {
    key: "bot_allowlist",
    label: "Bot Allowlist",
    description: "Bot duoc phep ton tai/gui tin trong group.",
    titleField: "username",
    fields: [
      { key: "bot_id", label: "Bot ID", type: "text" },
      { key: "username", label: "Username", type: "text" },
      { key: "chat_id", label: "Chat ID", type: "text" },
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "notes", label: "Ghi chu", type: "textarea" }
    ]
  },
  {
    key: "video_messages",
    label: "Videos",
    description: "Nguon message video de bot copy an danh.",
    titleField: "message_id",
    fields: [
      { key: "from_chat_id", label: "Source chat ID", type: "text", required: true },
      { key: "message_id", label: "Message ID", type: "text", required: true },
      { key: "caption", label: "Caption", type: "textarea" },
      { key: "pool", label: "Pool", type: "text" },
      { key: "weight", label: "Weight", type: "number" },
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "notes", label: "Ghi chu", type: "textarea" }
    ]
  }
];

export const TABLE_MAP = Object.fromEntries(TABLES.map((table) => [table.key, table]));
