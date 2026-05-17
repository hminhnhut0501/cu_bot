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
  start_fallback_text: "Tin /start khi chưa có nội dung"
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
    keys: ["scam_review_channel_id", "scam_report_pending_text", "scam_report_confirmed_text", "scam_check_safe_text", "scam_check_found_text"]
  }
];
const CONFIG_DESCRIPTIONS: Record<string, string> = {
  policy_text: "Nội quy gửi kèm khi thành viên bấm nút Quy định hoặc gọi lệnh liên quan.",
  show_policy_button: "Bật/tắt nút Quy định xuất hiện dưới tin nhắn /start.",
  policy_button_text: "Tên hiển thị của nút Quy định trong Telegram.",
  bot_menu_commands: "Các lệnh chính bot đăng ký cho menu Telegram.",
  help_menu_commands: "Các lệnh hiển thị trong nội dung /help.",
  start_fallback_text: "Tin nhắn dự phòng khi /start không có nội dung riêng.",
  delete_system_messages: "Tự xóa tin join/leave/pin và các tin hệ thống.",
  delete_forwarded_messages: "Chặn tin nhắn forward từ nơi khác.",
  delete_inline_keyboard_messages: "Chặn bài có nút bấm inline đáng ngờ.",
  delete_messages_from_bots: "Xóa tin do bot lạ gửi vào group.",
  remove_unknown_bots: "Tự kick bot không nằm trong danh sách cho phép.",
  exempt_admins: "Bỏ qua admin khi kiểm duyệt spam/keyword/link.",
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
  scam_report_pending_text: "Tin nhắn báo đã nhận report và chờ duyệt.",
  scam_report_confirmed_text: "Tin nhắn khi report đã được xác nhận.",
  scam_check_safe_text: "Kết quả trả về khi không tìm thấy dữ liệu scam.",
  scam_check_found_text: "Kết quả trả về khi tìm thấy đối tượng scam."
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

function configSectionFor(key: string) {
  return CONFIG_SECTIONS.find((section) => section.keys.includes(key));
}

function isConfigBoolean(row: Row) {
  const value = String(row.value ?? "").trim().toLowerCase();
  return ["true", "false"].includes(value);
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
  const [lookups, setLookups] = useState<Lookups>({ bots: [], groups: [], messages: [], videos: [] });

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
  const navGroups = useMemo(() => groupedNav(meta?.tables || []), [meta?.tables]);
  const activeGuide = table ? TABLE_GUIDES[table.key] : undefined;
  const messagePools = useMemo(() => uniqueValues(lookups.messages, "pool"), [lookups.messages]);
  const videoPools = useMemo(() => uniqueValues(lookups.videos, "pool"), [lookups.videos]);
  const hero = useMemo(() => heroFor(activeKey), [activeKey]);
  const HeroIcon = hero.icon;
  const visibleRows = useMemo(() => rows.filter((row) => {
    if (selectedBot && row.bot_key && row.bot_key !== selectedBot) {
      return false;
    }
    if (selectedGroup) {
      const rowGroup = String(row.group_id || row.chat_id || "");
      if (rowGroup && rowGroup !== selectedGroup) {
        return false;
      }
    }
    return true;
  }), [rows, selectedBot, selectedGroup]);
  const selectedVisibleRows = useMemo(() => visibleRows.filter((row) => selectedIds.has(String(row.id))), [visibleRows, selectedIds]);
  const workflow = useMemo(() => workflowFor(activeKey, visibleRows, selectedVisibleRows.length), [activeKey, visibleRows, selectedVisibleRows.length]);
  const WorkflowIcon = workflow?.icon;
  const dashboardRows = useMemo(() => visibleRows.filter((row) => table?.key === "bot_metrics" && row.enabled !== false), [visibleRows, table?.key]);
  const metricGroups = useMemo(() => {
    const groups: Record<string, Row[]> = {};
    for (const row of dashboardRows) {
      const period = String(row.period || "today");
      groups[period] = groups[period] || [];
      groups[period].push(row);
    }
    return Object.entries(groups);
  }, [dashboardRows]);

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
      const [botsPayload, groupsPayload, messagesPayload, videosPayload] = await Promise.all([
        api("/api/bots"),
        api("/api/groups"),
        api("/api/messages"),
        api("/api/video_messages")
      ]);
      setLookups({
        bots: botsPayload.rows || [],
        groups: groupsPayload.rows || [],
        messages: messagesPayload.rows || [],
        videos: videosPayload.rows || []
      });
    } catch {
      setLookups({ bots: [], groups: [], messages: [], videos: [] });
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

  function startCreate() {
    if (!table) {
      return;
    }
    setSelected(null);
    const nextDraft = emptyValues(table);
    if (selectedBot && table.fields.some((field) => field.key === "bot_key")) {
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
        <nav>
          {navGroups.map((group) => (
            <section className="nav-group" key={group.label}>
              <h2>{group.label}</h2>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  className={item.key === activeKey ? "active" : ""}
                  onClick={() => setActiveKey(item.key)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <section className={`hero-panel ${hero.tone}`}>
          <div className="hero-icon">
            <HeroIcon size={28} />
          </div>
          <div>
            <span>{table.label}</span>
            <h2>{hero.title}</h2>
            <p>{hero.desc}</p>
          </div>
          <div className="hero-stats">
            <strong>{visibleRows.length}</strong>
            <span>mục đang xem</span>
          </div>
        </section>

        <section className="scope-bar">
          <label>
            <span>Bot đang quản lý</span>
            <select value={selectedBot} onChange={(event) => setSelectedBot(event.target.value)}>
              <option value="">Tất cả bot</option>
              {lookups.bots.map((bot) => (
                <option key={bot.bot_key || bot.id} value={bot.bot_key || ""}>
                  {bot.name || bot.bot_key}
                </option>
              ))}
              {!lookups.bots.some((bot) => bot.bot_key === "main") ? <option value="main">main</option> : null}
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

        <section className="module-overview">
          <button type="button" onClick={() => setActiveKey("bot_metrics")}>
            <BarChart3 size={20} />
            <div>
              <span>Tổng quan</span>
              <strong>Thống kê, log, sức khỏe vận hành</strong>
            </div>
          </button>
          <button type="button" onClick={() => setActiveKey("verification_settings")}>
            <ShieldCheck size={20} />
            <div>
              <span>Bảo mật</span>
              <strong>Captcha, spam, scam, keyword, link</strong>
            </div>
          </button>
          <button type="button" onClick={() => setActiveKey("messages")}>
            <Sparkles size={20} />
            <div>
              <span>Nội dung</span>
              <strong>Tin nhắn, video, auto reply, lịch đăng</strong>
            </div>
          </button>
          <button type="button" onClick={() => setActiveKey("giveaway_campaigns")}>
            <Gift size={20} />
            <div>
              <span>Tương tác</span>
              <strong>Giveaway, điểm, event, giải trí</strong>
            </div>
          </button>
        </section>

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
                <input value={bulkDefaults.bot_key} onChange={(event) => updateBulkDefault("bot_key", event.target.value)} />
              </label>
              {["messages", "video_messages"].includes(table.key) ? (
                <>
                  <label>
                    <span>Nhóm nội dung</span>
                    <input value={bulkDefaults.pool} onChange={(event) => updateBulkDefault("pool", event.target.value)} />
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
            <div className="config-center-head">
              <div>
                <h3>Trung tâm cài đặt</h3>
                <p>Không cần nhớ mã cấu hình. Chọn nhóm bên dưới, bật/tắt nhanh hoặc sửa nội dung ngay trong card.</p>
              </div>
              <div className="config-summary">
                <span>{visibleRows.filter((row) => row.enabled !== false).length}</span>
                đang bật
              </div>
            </div>
            {CONFIG_SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              const sectionRows = visibleRows.filter((row) => section.keys.includes(String(row.key || "")));
              if (!sectionRows.length) {
                return null;
              }
              return (
                <section className={`config-section ${section.tone}`} key={section.title}>
                  <div className="config-section-title">
                    <div className="config-section-icon">
                      <SectionIcon size={22} />
                    </div>
                    <div>
                      <h4>{section.title}</h4>
                      <p>{section.desc}</p>
                    </div>
                  </div>
                  <div className="settings-grid">
                    {sectionRows.map((row) => {
                      const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                      const booleanValue = isConfigBoolean(row);
                      const active = row.enabled !== false;
                      return (
                        <article className={`setting-tile ${editing ? "editing" : ""}`} key={row.id || row.key}>
                          <div className="setting-top">
                            <div>
                              <h5>{configLabel(String(row.key || ""))}</h5>
                              <p>{CONFIG_DESCRIPTIONS[String(row.key || "")] || "Cài đặt vận hành của bot."}</p>
                            </div>
                            <span className={`status ${active ? "on" : "off"}`}>
                              <Power size={13} />
                              {active ? "Bật" : "Tắt"}
                            </span>
                          </div>

                          {editing ? (
                            <form className="setting-edit" onSubmit={save}>
                              {booleanValue ? (
                                <label className="switch-field">
                                  <span>Giá trị</span>
                                  <span className={`switch-control ${String(draft.value).toLowerCase() === "true" ? "checked" : ""}`}>
                                    <input
                                      type="checkbox"
                                      checked={String(draft.value).toLowerCase() === "true"}
                                      onChange={(event) => setDraft((current) => ({ ...current, value: event.target.checked ? "true" : "false" }))}
                                    />
                                    <b />
                                    <em>{String(draft.value).toLowerCase() === "true" ? "Bật" : "Tắt"}</em>
                                  </span>
                                </label>
                              ) : (
                                <label>
                                  <span>Nội dung</span>
                                  <textarea
                                    value={draft.value ?? ""}
                                    onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                                    rows={String(draft.value || "").length > 120 ? 7 : 3}
                                  />
                                </label>
                              )}
                              <label className="switch-field">
                                <span>Cho phép sử dụng</span>
                                <span className={`switch-control ${Boolean(draft.enabled) ? "checked" : ""}`}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(draft.enabled)}
                                    onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
                                  />
                                  <b />
                                  <em>{Boolean(draft.enabled) ? "Bật" : "Tắt"}</em>
                                </span>
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
                            <>
                              <div className="setting-value">
                                <span>Đang set</span>
                                <strong>{booleanValue ? displayValue(String(row.value).toLowerCase() === "true") : displayValue(row.value)}</strong>
                              </div>
                              <div className="setting-actions">
                                {booleanValue ? (
                                  <button type="button" className="secondary" disabled={saving} onClick={() => toggleConfigValue(row)}>
                                    <Power size={16} />
                                    {String(row.value).toLowerCase() === "true" ? "Tắt giá trị" : "Bật giá trị"}
                                  </button>
                                ) : null}
                                <button type="button" className="primary" onClick={() => startEdit(row)}>
                                  <Edit3 size={16} />
                                  Sửa nội dung
                                </button>
                              </div>
                            </>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            <section className="config-section other">
              <div className="config-section-title">
                <div className="config-section-icon">
                  <SlidersHorizontal size={22} />
                </div>
                <div>
                  <h4>Cài đặt khác</h4>
                  <p>Các key chưa được gom nhóm vẫn có thể chỉnh tại đây.</p>
                </div>
              </div>
              <div className="settings-grid compact">
                {visibleRows.filter((row) => !configSectionFor(String(row.key || ""))).map((row) => {
                  const editing = selected?.id === row.id && Object.keys(draft).length > 0;
                  return (
                    <article className={`setting-tile ${editing ? "editing" : ""}`} key={row.id || row.key}>
                      <div className="setting-top">
                        <div>
                          <h5>{configLabel(String(row.key || ""))}</h5>
                          <p>{String(row.key || "")}</p>
                        </div>
                        <span className={`status ${statusClass(row)}`}>
                          <Power size={13} />
                          {statusText(row)}
                        </span>
                      </div>
                      {editing ? (
                        <form className="setting-edit" onSubmit={save}>
                          <label>
                            <span>Nội dung</span>
                            <textarea
                              value={draft.value ?? ""}
                              onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                              rows={4}
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
                        <>
                          <div className="setting-value">
                            <span>Đang set</span>
                            <strong>{displayValue(row.value)}</strong>
                          </div>
                          <div className="setting-actions">
                            <button type="button" className="primary" onClick={() => startEdit(row)}>
                              <Edit3 size={16} />
                              Sửa
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
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
                      {fields.map((field) => (
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
                          ) : field.type === "select" ? (
                            <select value={draft[field.key] ?? ""} onChange={(event) => updateField(field, event.target.value)}>
                              <option value="">Mặc định</option>
                              {field.options?.map((option) => (
                                <option key={option} value={option}>
                                  {option}
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
                      ))}
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
