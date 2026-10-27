import {
  Activity,
  Archive,
  BarChart3,
  Gift,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import type { FieldConfig, TableConfig } from "@/lib/tables";
import { TABLES } from "@/lib/tables";
import type {
  BulkDefaults,
  BulkRow,
  ChannelButtonDraft,
  ChannelPostTab,
  EmptyStateConfig,
  Row,
  RuleTestResult,
} from "./cp-types";
import {
  ADVANCED_FIELD_KEYS,
  CONFIG_BOOLEAN_KEYS,
  CONFIG_DEFAULT_VALUES,
  CONFIG_DESCRIPTIONS,
  CONFIG_LABELS,
  CONFIG_SELECT_OPTIONS,
  CORE_LAYERS,
  CP_STATE_STORAGE_KEY,
  GROUP_BASE_SECTIONS,
  GROUP_MODULE_SECTIONS,
  GROUP_TAB_LABELS,
  GROUP_TAB_ORDER,
  NAV_GROUPS,
  SYSTEM_LAYERS,
  TABLE_GUIDES,
  bulkTables,
  defaultBoolean,
} from "./cp-constants";

export function emptyValues(table: TableConfig) {
  const values: Row = {};
  for (const field of table.fields) {
    if (field.type === "boolean") {
      values[field.key] = field.key === "enabled" || defaultBoolean.has(field.key);
    } else if (field.key === "bot_key") {
      values[field.key] = table.key === "bots" ? "" : "main";
    } else if (field.key === "bot_token" && table.key === "bots") {
      values[field.key] = "";
    } else if (field.key === "pool" || field.key.endsWith("_pool")) {
      values[field.key] = "default";
    } else if (field.key === "weight") {
      values[field.key] = 1;
    } else if (field.key === "settings") {
      values[field.key] = "{}";
    } else if (field.key === "status" && table.key === "channel_posts") {
      values[field.key] = "draft";
    } else if (field.key === "parse_mode") {
      values[field.key] = "HTML";
    } else if (field.key === "status") {
      values[field.key] = "active";
    } else if (field.key === "role") {
      values[field.key] = "member";
    } else if (field.key === "action") {
      values[field.key] = "delete";
    } else if (field.key === "match") {
      values[field.key] = table.key === "auto_replies" ? "smart" : "contains";
    } else {
      values[field.key] = "";
    }
  }
  return values;
}

export function draftFromRow(row: Row) {
  const draft = { ...row };
  for (const [key, value] of Object.entries(draft)) {
    if (value && typeof value === "object") {
      draft[key] = JSON.stringify(value, null, 2);
    }
  }
  return draft;
}

export function titleFor(row: Row, table: TableConfig) {
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
      member_joined: "Thành viên vào nhóm",
      member_left: "Thành viên rời nhóm",
      member_join_request: "Yêu cầu tham gia nhóm",
      scam_report_confirmed: "Đã xác nhận báo cáo scam",
      scam_report_rejected: "Đã từ chối báo cáo scam"
    };
    const action = String(row.action || "");
    return labels[action.toLowerCase()] || action.replaceAll("_", " ") || `Nhật ký #${row.id}`;
  }
  if (table.key === "scam_reports") {
    return row.target_username || row.target_name || row.bank_account || row.phone || row.target_uid || `Report #${row.id}`;
  }
  if (table.key === "scam_entities") {
    return row.name || row.username || row.bank_account || row.uid || `Entity #${row.id}`;
  }
  return row[table.titleField] || row.key || row.message || row.keyword || row.group_id || `#${row.id}`;
}

export function configLabel(key: string) {
  return CONFIG_LABELS[key] || key.replaceAll("_", " ");
}

export function configDescription(row: Row) {
  const key = String(row.key || "");
  return CONFIG_DESCRIPTIONS[key] || String(row.notes || "Cài đặt nâng cao dùng cho vận hành bot.");
}

export function isConfigBoolean(row: Row) {
  const key = String(row.key || "");
  if (CONFIG_BOOLEAN_KEYS.has(key)) {
    return true;
  }
  const value = String(row.value ?? "").trim().toLowerCase();
  return ["true", "false"].includes(value);
}

export function materializeConfigRows(rows: Row[], expectedKeys: string[], botKey: string) {
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

export function readSettingsObject(settings: unknown) {
  if (!settings) {
    return {} as Record<string, unknown>;
  }
  if (typeof settings === "string") {
    try {
      const parsed = JSON.parse(settings);
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  if (typeof settings === "object") {
    return settings as Record<string, unknown>;
  }
  return {};
}

export function isVirtualConfigRow(row: Row) {
  return String(row.id || "").startsWith("virtual:");
}

export function configDisplayValue(row: Row) {
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
  if (!value.trim() && key.endsWith("_action")) {
    return "Cảnh báo";
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

export function configValueCaption(row: Row) {
  const key = String(row.key || "");
  if (["scan_hidden_links", "scan_text_link", "scan_text_mention", "allow_in_group_mentions", "moderation_enabled", "delete_system_messages", "delete_forwarded_messages", "allow_forward_messages", "allow_automatic_forwards", "delete_inline_keyboard_messages", "delete_messages_from_bots", "remove_unknown_bots", "exempt_admins", "scan_bio_links", "bio_link_delete_message", "duplicate_message_enabled", "send_on_boot", "send_if_silent", "show_policy_button"].includes(key)) {
    return "Bật / tắt";
  }
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

export function configPlaceholders(key: string) {
  if (["warning_text", "forward_warning_text", "spam_restrict_text", "bio_link_warning_text"].includes(key)) {
    return ["{mention}", "{reason}", "{count}", "{limit}", "{user_id}"];
  }
  return [];
}

export function configFieldHint(key: string) {
  if (["forward_warning_reason", "duplicate_message_reason"].includes(key)) {
    return "Đây là lý do cố định, không cần placeholder.";
  }
  if (key === "forward_allowed_content_types") {
    return "Chọn các loại nội dung được phép forward.";
  }
  if (key === "forward_allowed_sources") {
    return "Chọn nguồn forward được phép như channel_private, channel_public, group_private, group_public, user hoặc bot.";
  }
  return "";
}

export function configEditorKind(key: string) {
  if (key === "forward_allowed_content_types") {
    return "multiselect";
  }
  if (key === "forward_allowed_sources") {
    return "multiselect_sources";
  }
  if (CONFIG_BOOLEAN_KEYS.has(key)) {
    return "boolean";
  }
  if (key.endsWith("_action")) {
    return "select";
  }
  if (
    key.endsWith("_seconds") ||
    key.endsWith("_count") ||
    key.endsWith("_messages") ||
    ["ban_after_warnings", "ban_seconds", "spam_max_messages", "duplicate_message_max_count", "media_spam_max_messages"].includes(key)
  ) {
    return "number";
  }
  if (
    key.endsWith("_text") ||
    key.includes("reason") ||
    key.includes("commands") ||
    key.includes("content_types") ||
    ["policy_text", "start_fallback_text", "help_menu_title", "scam_review_channel_text"].includes(key)
  ) {
    return "textarea";
  }
  return "text";
}

export function configSelectOptions(key: string) {
  if (!key.endsWith("_action")) {
    return [];
  }
  return [
    { value: "warn", label: "Warn - cảnh báo và xóa" },
    { value: "delete", label: "Delete - xóa tin" },
    { value: "restrict", label: "Restrict - hạn chế tạm" },
    { value: "mute", label: "Mute - im lặng tạm" },
    { value: "kick", label: "Kick - đá khỏi group" },
    { value: "ban", label: "Ban - chặn khỏi group" }
  ];
}

export function configInputGuide(key: string) {
  if (key.endsWith("_seconds")) {
    return "Nhập số giây.";
  }
  if (key.endsWith("_count")) {
    return "Nhập số lượng.";
  }
  return "";
}

export function friendlySaveError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "Không thể lưu.");
  if (message.includes("bio_link_delete_message") && message.includes("schema cache")) {
    return "DB còn thiếu cột bio_link_delete_message trong groups. Chạy migration docs/supabase/migrations/20260522_add_groups_moderation_columns.sql rồi thử lưu lại.";
  }
  if (message.includes("schema cache") && message.includes("groups")) {
    return "Schema nhóm chưa khớp với UI. Hãy chạy migration groups mới trong docs/supabase.";
  }
  return message || "Không thể lưu.";
}

export function fieldUnitHint(field: FieldConfig) {
  const key = field.key;
  if (field.type === "number") {
    if (key === "ban_seconds") {
      return "Đơn vị: giây. 0 = ban vĩnh viễn.";
    }
    if (key.endsWith("_seconds")) {
      return "Đơn vị: giây. 300 = 5 phút, 3600 = 1 giờ.";
    }
    if (["spam_max_messages", "duplicate_message_max_count", "ban_after_warnings", "media_spam_max_messages"].includes(key)) {
      return "Đơn vị: số lần / số tin.";
    }
  }
  if (["spam_action", "forward_action", "inline_keyboard_action", "duplicate_message_action", "media_spam_action"].includes(key)) {
    return "warn = xóa tin vi phạm + cảnh báo.";
  }
  if (["forward_warning_reason", "duplicate_message_reason"].includes(key)) {
    return "Lý do cố định, không cần placeholder.";
  }
  if (key === "moderation_enabled") {
    return "Tắt để group này không chạy moderation.";
  }
  if (key === "scan_hidden_links") {
    return "Bật để áp dụng toàn bộ rule link ẩn.";
  }
  if (key === "scan_text_link") {
    return "Bật để chặn link ẩn gắn vào chữ bấm.";
  }
  if (key === "scan_text_mention") {
    return "Bật để chặn mention ẩn.";
  }
  if (key === "allow_in_group_mentions") {
    return "Bật nếu muốn cho phép @user giữa thành viên.";
  }
  if (key === "scan_bio_links") {
    return "Bật để bot quét bio người gửi.";
  }
  if (key === "allow_forward_messages") {
    return "Bật để cho forward đi qua nhưng vẫn scan nội dung.";
  }
  if (key === "delete_forwarded_messages") {
    return "Bật để chặn forward hoàn toàn. Không nên bật cùng lúc với cho phép forward.";
  }
  if (key === "forward_allowed_sources") {
    return "Chọn riêng nguồn forward theo channel/group công khai hay riêng tư.";
  }
  if (key === "forward_allowed_content_types") {
    return "Ví dụ: text, photo, video. Để trống để cho phép mọi loại.";
  }
  if (key === "bio_link_delete_message") {
    return "Xóa tin vi phạm nếu bio chứa link.";
  }
  if (key === "bio_link_restrict_seconds") {
    return "0 = giữ restrict cho tới khi admin mở lại.";
  }
  if (key === "bio_scan_cache_seconds") {
    return "Cache quét bio theo giây. 3600 = 1 giờ.";
  }
  return "";
}

export function fieldByKey(table: TableConfig, key: string) {
  return table.fields.find((field) => field.key === key);
}

export function displayValue(value: unknown) {
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

export function formatDateTime(value: unknown) {
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

export function vietnamDayKey(value: unknown) {
  if (!value) {
    return "";
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function parseDetails(value: unknown) {
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
    const raw = String(value);
    const pairs = raw
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index > 0 ? [part.slice(0, index).trim(), part.slice(index + 1).trim()] : null;
      })
      .filter((part): part is string[] => Boolean(part));
    if (pairs.length) {
      return { raw, ...Object.fromEntries(pairs) };
    }
    return { raw };
  }
}

export function auditLegacyReason(value: unknown) {
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

export function isAutomaticAudit(row: Row) {
  return ["delete_message", "ban", "kick", "warn", "restrict", "verify_success"].includes(String(row.action || "").toLowerCase());
}

export function auditActor(row: Row, details: Record<string, unknown>) {
  const actor = row.actor_user_id || details.actor_user_id || details.actor_username;
  if (actor) {
    return displayValue(actor);
  }
  return isAutomaticAudit(row) ? "Bot tự động" : "Chưa đặt";
}

export function auditReason(row: Row, details: Record<string, unknown>) {
  return displayValue(details.reason || details.trigger_reason || auditLegacyReason(details.raw || row.details));
}

export function auditDeletedContent(row: Row, details: Record<string, unknown>) {
  return displayValue(details.deleted_text || details.message || details.text || details.content || (row.action === "delete_message" ? "" : details.raw || row.details));
}

export function auditLogSpecificRows(row: Row, details: Record<string, unknown>) {
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
    const keywordParts = [
      displayValue(details.matched_keyword_raw || details.matched_keyword),
      details.match_type ? `kiểu: ${displayValue(details.match_type)}` : "",
      details.keyword_rule_id ? `rule #${displayValue(details.keyword_rule_id)}` : ""
    ].filter(Boolean);
    rows.push({ label: "Từ khóa", value: keywordParts.join(" · ") });
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

export function auditLogRows(row: Row) {
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

export function auditLogCardData(row: Row, groupNameForId: (groupId: string) => string) {
  const details = parseDetails(row.details);
  const groupId = String(row.chat_id || details.chat_id || details.group_id || "");
  const targetId = String(row.target_user_id || details.target_user_id || details.target_username || "");
  const actorId = String(details.actor_user_id || row.actor_user_id || "");
  const action = actionBadge(row, { key: "audit_logs", label: "Nhật ký", description: "", titleField: "action", summaryFields: [], fields: [] });
  const severity = auditLogSeverity(row);
  return {
    time: formatDateTime(row.created_at || details.created_at),
    action,
    severity,
    groupLabel: groupNameForId(groupId) || groupId || "Chưa rõ group",
    groupId,
    actorLabel: auditActor(row, details),
    actorId,
    targetLabel: displayValue(details.target_username || row.target_user_id || details.target_user_id || details.target_username || targetId),
    targetId,
    reason: auditReason(row, details),
    brief: auditLogSpecificRows(row, details).slice(0, 2),
    raw: details.raw || row.details,
  };
}

export function auditActionTone(action: string): "error" | "warning" | "success" | "info" | "default" {
  const normalized = String(action || "").toLowerCase();
  if (["ban", "kick", "scam_report_confirmed"].includes(normalized)) return "error";
  if (["delete_message", "warn", "scam_report_rejected"].includes(normalized)) return "warning";
  if (["member_joined", "member_join_request"].includes(normalized)) return "success";
  if (["mute", "restrict", "module_update", "role_update", "title_update"].includes(normalized)) return "info";
  return "default";
}

export function auditLogEssentials(row: Row) {
  const details = parseDetails(row.details);
  const specificRows = auditLogSpecificRows(row, details);
  const primaryDetail = specificRows.find((item) => ["Từ khóa", "Bio link", "Domain", "Nguồn forward", "Tin đã xóa"].includes(item.label));
  return [
    { label: "Người thực hiện", value: auditActor(row, details) },
    { label: "Đối tượng", value: displayValue(row.target_user_id || details.target_user_id || details.target_username) },
    { label: "Lý do", value: auditReason(row, details) },
    primaryDetail || { label: "Group/Kênh", value: displayValue(row.chat_id || details.chat_id || details.group_id) }
  ];
}

export function auditLogSeverity(row: Row) {
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

export function auditLogSummary(row: Row) {
  const details = auditLogRows(row);
  const time = details.find((item) => item.label === "Thời gian")?.value;
  const actor = details.find((item) => item.label === "Người thực hiện")?.value;
  const target = details.find((item) => item.label === "Đối tượng")?.value;
  return `${time} · ${actor} -> ${target}`;
}

export function metricLabel(key: string) {
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

export function metricPeriod(period: string) {
  const labels: Record<string, string> = {
    today: "Hôm nay",
    week: "Tuần này",
    month: "Tháng này",
    all_time: "Tất cả"
  };
  return labels[period] || period || "Chưa đặt";
}

export function metricValue(row: Row) {
  const value = Number(row.metric_value || 0);
  return Number.isFinite(value) ? value.toLocaleString("vi-VN") : displayValue(row.metric_value);
}

export function previewText(row: Row, table: TableConfig) {
  if (table.key === "scam_reports") {
    return scamReportSummary(row);
  }
  const key = table.titleField;
  const raw = row[key] || row.value || row.reason || row.notes || "";
  return String(raw).replace(/\s+/g, " ").trim();
}

export function scamReportTarget(row: Row) {
  return row.target_username || row.bank_account || row.phone || row.target_uid || "Chưa rõ đối tượng";
}

export function scamReportSummary(row: Row) {
  const reporter = row.reporter_username || row.reporter_user_id || "ẩn danh";
  const target = scamReportTarget(row);
  const evidence = String(row.evidence || "Chưa có bằng chứng").replace(/\s+/g, " ").trim();
  return `Người báo cáo: ${reporter} · Đối tượng: ${target} · Bằng chứng: ${evidence}`;
}

export function scamReportFacts(row: Row) {
  return [
    { label: "Người báo cáo", value: displayValue(row.reporter_username || row.reporter_user_id) },
    { label: "Đối tượng", value: displayValue(scamReportTarget(row)) },
    { label: "Tài khoản", value: displayValue(row.bank_account) },
    { label: "Điện thoại", value: displayValue(row.phone) },
    { label: "Trạng thái", value: statusText(row) }
  ];
}

export function statusClass(row: Row) {
  if (row.enabled === false || row.status === "paused" || row.status === "closed" || row.status === "rejected") {
    return "off";
  }
  if (row.status === "pending" || row.status === "draft") {
    return "pending";
  }
  return "on";
}

export function statusText(row: Row) {
  if (row.enabled === false) {
    return "Tắt";
  }
  const labels: Record<string, string> = {
    active: "Chạy",
    open: "Mở",
    drawn: "Đã quay",
    closed: "Đã đóng",
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    rejected: "Từ chối",
    draft: "Nháp"
  };
  return labels[String(row.status || "")] || "Chạy";
}

export function healthState(row: Row, tableKey = "") {
  if (tableKey === "channel_posts") {
    const status = String(row.status || "draft").toLowerCase();
    if (row.enabled === false) {
      return { className: "disabled", label: "Tắt" };
    }
    if (["pending", "queued"].includes(status)) {
      return { className: "setup", label: "Chờ gửi" };
    }
    if (status === "scheduled") {
      return { className: "setup", label: "Đã lên lịch" };
    }
    if (["sending", "deleting"].includes(status)) {
      return { className: "setup", label: "Đang xử lý" };
    }
    if (status === "sent") {
      return { className: "healthy", label: "Đã gửi" };
    }
    if (status === "delete_scheduled") {
      return { className: "healthy", label: "Đã gửi · chờ xóa" };
    }
    if (status === "deleted") {
      return { className: "disabled", label: "Đã xóa" };
    }
    if (["failed", "delete_failed"].includes(status)) {
      return { className: "error", label: "Lỗi gửi" };
    }
    return { className: "setup", label: "Nháp" };
  }
  if (row.enabled === false || row.status === "paused" || row.status === "closed" || row.status === "rejected") {
    return { className: "disabled", label: "Tắt" };
  }
  if (row.status === "pending" || row.status === "draft" || row.status === "watch") {
    return { className: "setup", label: "Cần setup" };
  }
  if (row.status === "error" || row.status === "danger") {
    return { className: "error", label: "Lỗi" };
  }
  return { className: "healthy", label: "Ổn định" };
}

export function actionBadge(row: Row, table: TableConfig) {
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
        scam_report_rejected: "Từ chối scam",
        scheduled_posts_inactive: "Lịch gửi đang tắt",
        scheduled_posts_not_configured: "Lịch gửi chưa cấu hình",
        scheduled_posts_jobs_loaded: "Đã nạp lịch gửi",
        scheduled_message_catch_up: "Gửi bù lịch trễ",
        scheduled_message_skipped: "Bỏ qua gửi tin",
        scheduled_message_sent: "Đã gửi tin định kỳ",
        scheduled_message_failed: "Lỗi gửi tin định kỳ",
        scheduled_video_skipped: "Bỏ qua gửi video",
        scheduled_video_catch_up: "Gửi bù video trễ",
        scheduled_video_sent: "Đã gửi video định kỳ",
        scheduled_video_failed: "Lỗi gửi video định kỳ",
        member_mute: "Cấm chat",
        member_unmute: "Mở chat",
        member_ban: "Ban thành viên",
        member_unban: "Gỡ ban",
        member_kick: "Kick thành viên",
        member_blacklist: "Thêm blacklist",
        member_unblacklist: "Gỡ blacklist",
        member_blacklist_join_blocked: "Đã chặn join",
        member_blacklist_join_block_failed: "Lỗi chặn join"
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

export function detailRows(row: Row, table: TableConfig) {
  const keys = Array.from(new Set([...table.summaryFields, "bot_key", "group_id", "chat_id", "match", "action", "reason", "status", "enabled"]));
  return keys
    .filter((key) => !fieldIsAdvanced(table.key, key) && row[key] !== undefined && row[key] !== null && row[key] !== "")
    .slice(0, 10)
    .map((key) => ({ key, label: fieldByKey(table, key)?.label || key.replaceAll("_", " "), value: displayValue(row[key]) }));
}

export function advancedDetailRows(row: Row, table: TableConfig) {
  const keys = Array.from(new Set(["id", "created_at", "updated_at", "settings", "key", ...Object.keys(row)]));
  return keys
    .filter((key) => fieldIsAdvanced(table.key, key) && row[key] !== undefined && row[key] !== null && row[key] !== "")
    .slice(0, 12)
    .map((key) => ({ key, label: fieldByKey(table, key)?.label || key.replaceAll("_", " "), value: displayValue(row[key]) }));
}

export function fieldIsAdvanced(tableKey: string, fieldKey: string) {
  if (ADVANCED_FIELD_KEYS.has(fieldKey)) {
    return true;
  }
  if (tableKey === "config" && fieldKey === "key") {
    return true;
  }
  return false;
}

export function rowMatchesQuickFilter(row: Row, filter: string) {
  if (!filter || filter === "all") {
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

export function tableHasField(table: TableConfig | undefined, fieldKey: string) {
  return Boolean(table?.fields.some((field) => field.key === fieldKey));
}

export function tableSupportsScope(table: TableConfig | undefined, scope: "bot" | "group") {
  if (scope === "bot") {
    return tableHasField(table, "bot_key");
  }
  return tableHasField(table, "group_id") || tableHasField(table, "chat_id");
}

export function buildScopedQuery(table: TableConfig, searchText: string, selectedBot: string, selectedScope: string) {
  const params = new URLSearchParams();
  if (searchText.trim()) {
    params.set("search", searchText.trim());
  }
  if (selectedBot && tableSupportsScope(table, "bot")) {
    params.set("bot_key", selectedBot);
  }
  if (selectedScope && tableSupportsScope(table, "group")) {
    params.set("group_id", selectedScope);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function normalizedText(value: unknown) {
  return String(value || "").toLowerCase();
}

export function safeRegexMatch(pattern: unknown, text: string) {
  try {
    return new RegExp(String(pattern), "i").test(text);
  } catch {
    return false;
  }
}

export function rowMatchesRule(row: Row, text: string, key: string) {
  const source = String(row[key] || "").trim();
  const matchMode = String(row.match || "contains").toLowerCase();
  if (!source || !text) {
    return false;
  }
  const sourceNormalized = normalizedText(source).trim();
  const textNormalized = normalizedText(text).trim();
  const tokens = (value: string): string[] => normalizedText(value).match(/[a-z0-9_]+/g) || [];
  const containsWholeWord = (fullText: string, word: string) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9_])${escaped}([^a-z0-9_]|$)`, "i").test(fullText);
  };
  if (matchMode === "regex") {
    return safeRegexMatch(source, text);
  }
  if (matchMode === "exact") {
    return textNormalized === sourceNormalized;
  }
  if (matchMode === "smart") {
    const sourceTokens = tokens(source);
    const textTokens = tokens(text);
    if (!sourceTokens.length || !textTokens.length) {
      return false;
    }
    if (sourceTokens.length === 1) {
      return textTokens.includes(sourceTokens[0]);
    }
    return textNormalized.includes(sourceNormalized) || sourceTokens.every((token) => textTokens.includes(token));
  }
  if (!sourceNormalized) {
    return false;
  }
  if (!sourceNormalized.includes(" ")) {
    return containsWholeWord(textNormalized, sourceNormalized);
  }
  return textNormalized.includes(sourceNormalized);
}

export function extractDomains(text: string) {
  return Array.from(text.matchAll(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi))
    .map((match) => match[1].toLowerCase());
}

export function testRowsForTable(tableKey: string, rows: Row[], text: string): RuleTestResult[] {
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

export function cockpitMetrics(row: Row, table: TableConfig) {
  const action = actionBadge(row, table);
  const health = healthState(row).label;
  const scope = row.group_id || row.chat_id || row.bot_key || "Toàn hệ thống";
  return [
    { label: "Sức khỏe", value: health },
    { label: "Hành động", value: action },
    { label: "Phạm vi", value: String(scope) }
  ];
}

export function cockpitActivity(row: Row, table: TableConfig) {
  const title = titleFor(row, table);
  const action = actionBadge(row, table).toLowerCase();
  return [
    `${title} đã được tải từ Supabase`,
    `Chính sách ${action} đã sẵn sàng đồng bộ runtime`,
    `Đã kiểm tra phạm vi ${row.group_id || row.chat_id || row.bot_key || "global"}`
  ];
}

export function heroFor(activeKey: string) {
  if (["keywords", "domain_blacklist", "link_shorteners", "verification_settings", "captcha_questions", "bot_allowlist"].includes(activeKey)) {
    return { title: "Trung tâm bảo mật", desc: "Chặn spam, link xấu, captcha và quyền bot bằng các lựa chọn rõ ràng.", icon: ShieldCheck, tone: "security" };
  }
  if (["messages", "video_messages", "channel_posts", "auto_replies", "scheduled_posts"].includes(activeKey)) {
    return { title: "Trung tâm nội dung", desc: "Quản lý tin nhắn, video, auto reply và lịch gửi theo group.", icon: Sparkles, tone: "content" };
  }
  if (["scam_entities", "scam_reports"].includes(activeKey)) {
    return { title: "Trung tâm chống scam", desc: "Tra cứu, báo cáo và duyệt dữ liệu lừa đảo từ thành viên.", icon: Archive, tone: "scam" };
  }
  if (["giveaway_campaigns", "giveaway_entries", "entertainment_events", "reputation_rules", "share_unlock_campaigns", "share_unlock_invites", "share_unlock_referrals"].includes(activeKey)) {
    return { title: "Trung tâm tương tác", desc: "Giveaway, event, điểm tương tác và các hoạt động giữ group sống.", icon: Gift, tone: "fun" };
  }
  return { title: "Bảng điều khiển", desc: "Chọn bot, chọn group, rồi cấu hình từng module bằng thao tác thân thiện.", icon: BarChart3, tone: "main" };
}

export function workflowFor(tableKey: string, rows: Row[], selectedCount: number) {
  if (tableKey === "keywords") {
    const actions = ["delete", "warn", "mute", "kick", "ban"].map((action) => ({
      label: action,
      count: rows.filter((row) => row.action === action).length
    }));
    return {
      title: "Quy trình chặn nội dung xấu",
      body: "Rule từ khóa đang dùng kiểu xóa tin trước, sau đó cộng cảnh báo nội bộ. Khi chạm ban_after_warnings, bot sẽ tự ban để tránh lách luật.",
      icon: ShieldCheck,
      chips: [
        { label: "Đã chọn", value: selectedCount },
        { label: "Bật", value: rows.filter((row) => row.enabled !== false).length },
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
        { label: "Tin bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "scheduled_posts") {
    return {
      title: "Flow gửi tin hẹn giờ",
      body: "Để gửi chào buổi sáng lúc 09:00: bật module Tự động hóa, bấm Tạo lịch gửi tin, nhập nội dung và lưu.",
      icon: SlidersHorizontal,
      chips: [
        { label: "Lịch bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Group có lịch", value: uniqueValues(rows, "chat_id").length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "channel_posts") {
    return {
      title: "Đăng bài lên channel",
      body: "Soạn nội dung, thêm nút inline, đặt trạng thái pending để bot gửi. Kết quả gửi nằm ngay trên từng dòng.",
      icon: MessageSquare,
      chips: [
        { label: "Chờ gửi", value: rows.filter((row) => row.status === "pending").length },
        { label: "Đã gửi", value: rows.filter((row) => row.status === "sent").length },
        { label: "Lỗi", value: rows.filter((row) => ["failed", "delete_failed"].includes(String(row.status))).length }
      ]
    };
  }
  if (tableKey === "auto_replies") {
    return {
      title: "Câu hỏi tự trả lời",
      body: "Tạo cặp Câu kích hoạt -> Nội dung trả lời. Khuyên dùng kiểu Smart để bot hiểu theo từ khóa/ngữ cảnh và bớt trả lời bừa.",
      icon: Activity,
      chips: [
        { label: "Câu trả lời", value: rows.length },
        { label: "Regex", value: rows.filter((row) => row.match === "regex").length },
        { label: "Bật", value: rows.filter((row) => row.enabled !== false).length }
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
        { label: "Video bật", value: rows.filter((row) => row.enabled !== false).length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "giveaway_campaigns") {
    return {
      title: "Giveaway và quay số",
      body: "Tạo chiến dịch, đặt phần thưởng, số người thắng và trạng thái. Lượt tham gia nằm ở mục Lượt tham gia.",
      icon: Gift,
      chips: [
        { label: "Mở", value: rows.filter((row) => row.status === "open").length },
        { label: "Đã quay", value: rows.filter((row) => row.status === "drawn").length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "share_unlock_campaigns") {
    return {
      title: "Mở khóa bằng mời bạn",
      body: "Mỗi member có một link riêng. Khi đủ số người vào group qua link đó, bot sẽ mở khóa link thưởng.",
      icon: Gift,
      chips: [
        { label: "Đang mở", value: rows.filter((row) => row.status === "open").length },
        { label: "Đã đóng", value: rows.filter((row) => row.status === "closed").length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  if (tableKey === "share_unlock_referrals") {
    return {
      title: "Lượt mời hợp lệ",
      body: "Theo dõi ai là người giới thiệu, ai là user vào qua link và lượt nào được tính.",
      icon: Users,
      chips: [
        { label: "Lượt hợp lệ", value: rows.filter((row) => row.counted !== false).length },
        { label: "Người giới thiệu", value: uniqueValues(rows, "referrer_user_id").length },
        { label: "Đã chọn", value: selectedCount }
      ]
    };
  }
  return null;
}

export function emptyStateFor(tableKey: string): EmptyStateConfig {
  const states: Record<string, EmptyStateConfig> = {
    messages: {
      title: "Chưa có tin nhắn",
      body: "Tạo pool đầu tiên để dùng cho group.",
      action: "Tạo tin nhắn",
      steps: ["Nhập nhanh", "Lưu pool", "Gán cho group"]
    },
    video_messages: {
      title: "Chưa có video",
      body: "Tạo nguồn video để dùng lại.",
      action: "Tạo video source",
      steps: ["Nhập source", "Lưu video", "Gán cho group"]
    },
    keywords: {
      title: "Chưa có rule",
      body: "Tạo rule đầu tiên cho module.",
      action: "Tạo rule đầu tiên",
      steps: ["Chọn action", "Nhập keyword", "Test nhanh"]
    },
    auto_replies: {
      title: "Chưa có auto reply",
      body: "Tạo trigger để bot trả lời tự động.",
      action: "Tạo auto reply",
      steps: ["Nhập trigger", "Nhập câu trả lời", "Test trước khi bật"]
    },
    share_unlock_campaigns: {
      title: "Chưa có campaign mở khóa",
      body: "Tạo campaign đầu tiên để user mời bạn qua link riêng rồi mở khóa phần thưởng.",
      action: "Tạo campaign mở khóa",
      steps: ["Chọn group nguồn", "Đặt số người cần mời", "Nhập link phần thưởng"]
    },
    scheduled_posts: {
      title: "Chưa có lịch",
      body: "Tạo lịch gửi cho group.",
      action: "Tạo lịch gửi tin",
      steps: ["Chọn pool", "Đặt giờ", "Lưu lịch"]
    },
    channel_posts: {
      title: "Chưa có bài",
      body: "Tạo bài đầu tiên cho channel.",
      action: "Tạo bài đăng",
      steps: ["Chọn channel", "Soạn nội dung", "Lưu bài"]
    },
    bots: {
      title: "Chưa có bot",
      body: "Thêm bot để bắt đầu vận hành.",
      action: "Thêm bot",
      steps: ["Nhập bot_key", "Thêm token", "Lưu bot"]
    },
    groups: {
      title: "Chưa có group",
      body: "Thêm group để gán bot và module.",
      action: "Thêm group",
      steps: ["Nhập group ID", "Lưu group", "Chọn bot"]
    }
  };
  return states[tableKey] || {
    title: "Chưa có dữ liệu",
    body: "Tạo mục đầu tiên cho phạm vi này.",
    action: "Tạo mục đầu tiên",
    steps: ["Bấm Thêm", "Điền thông tin", "Lưu lại"]
  };
}

export function groupedFields(table: TableConfig) {
  const groups: Record<string, FieldConfig[]> = {};
  for (const field of table.fields) {
    const section = field.section || "Thông tin";
    groups[section] = groups[section] || [];
    groups[section].push(field);
  }
  return Object.entries(groups);
}

export function sortGroupFieldGroups(groups: [string, FieldConfig[]][]) {
  return [...groups].sort(([left], [right]) => {
    const leftIndex = GROUP_TAB_ORDER.indexOf(left);
    const rightIndex = GROUP_TAB_ORDER.indexOf(right);
    return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
  });
}

export function groupTabLabel(section: string) {
  return GROUP_TAB_LABELS[section] || section;
}

export function allowedGroupSectionsForLayer(activeLayer: string) {
  if (!activeLayer.startsWith("module:")) {
    return GROUP_BASE_SECTIONS;
  }
  const moduleKey = activeLayer.replace("module:", "");
  return GROUP_MODULE_SECTIONS[moduleKey] || GROUP_BASE_SECTIONS;
}

export function dangerousGroupChanges(values: Row) {
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

export function poolRows(rows: Row[], pool: string) {
  const targetPool = String(pool || "").trim();
  if (!targetPool) {
    return [];
  }
  return rows.filter((row) => row.enabled !== false && String(row.pool || "").trim() === targetPool);
}

export function uniquePoolCounts(rows: Row[]) {
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

export function poolPreviewText(row: Row, type: "message" | "video") {
  if (type === "video") {
    const source = [row.from_chat_id, row.message_id].filter(Boolean).join(" / ");
    return row.caption || source || "Video chưa có caption/source rõ ràng";
  }
  return row.message || row.text || row.content || "Tin nhắn chưa có nội dung";
}

export function splitBulkLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseDelimited(line: string) {
  const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : line.includes(",") ? "," : "";
  if (!delimiter) {
    return [line];
  }
  return line.split(delimiter).map((part) => part.trim());
}

export function parseSheetOrPipe(line: string) {
  const delimiter = line.includes("\t") ? "\t" : line.includes("|") ? "|" : "";
  if (!delimiter) {
    return [line.trim()];
  }
  return line.split(delimiter).map((part) => part.trim());
}

export function parseBulkRows(tableKey: string, text: string, defaults: BulkDefaults): BulkRow[] {
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
      const [trigger, reply = "", match = "smart"] = parseDelimited(line);
      return { bot_key: defaults.bot_key, trigger, reply, match: match || "smart", enabled: defaults.enabled };
    }).filter((row) => row.trigger && row.reply);
  }

  return [];
}

export function bulkHint(tableKey: string) {
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
    return "Mỗi dòng: câu hỏi | nội dung trả lời | smart/exact/contains/regex. Muốn random nhiều mẫu, ngăn bằng || hoặc xuống dòng.";
  }
  return "";
}

export function groupedNav(tables: TableConfig[]) {
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

export function uniqueValues(rows: Row[], key: string) {
  return Array.from(new Set(rows.map((row) => String(row[key] || "").trim()).filter(Boolean))).sort();
}

export function channelPostTabFor(row: Row): ChannelPostTab {
  const status = String(row.status || "draft").toLowerCase();
  if (status === "scheduled") return "scheduled";
  if (["sent", "delete_scheduled", "deleting"].includes(status)) return "sent";
  if (status === "deleted") return "deleted";
  if (["failed", "delete_failed"].includes(status)) return "failed";
  return "queue";
}

export function channelButtonsFromText(value: unknown): ChannelButtonDraft[] {
  const buttons: ChannelButtonDraft[] = [];
  String(value || "").split("\n").forEach((line, row) => {
    line.split("||").forEach((chunk) => {
      const [label, url] = chunk.split("|", 2).map((item) => item.trim());
      if (label || url) buttons.push({ label: label || "", url: url || "", row });
    });
  });
  return buttons.length ? buttons : [{ label: "", url: "", row: 0 }];
}

export function channelButtonsToText(buttons: ChannelButtonDraft[]) {
  const rows = new Map<number, string[]>();
  buttons.forEach((button) => {
    if (!button.label.trim() && !button.url.trim()) return;
    rows.set(button.row, [...(rows.get(button.row) || []), `${button.label.trim()} | ${button.url.trim()}`]);
  });
  return Array.from(rows.entries()).sort(([left], [right]) => left - right).map(([, items]) => items.join(" || ")).join("\n");
}

export function vietnamDateTimeInput(value: unknown) {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  return parts.replace(" ", "T");
}

export function vietnamInputToIso(value: string) {
  if (!value) return null;
  return new Date(`${value}:00+07:00`).toISOString();
}

export function actionLabel(value: unknown) {
  const labels: Record<string, string> = {
    warn: "Xóa và cảnh báo",
    delete: "Xóa tin",
    restrict: "Hạn chế chat",
    mute: "Hạn chế chat",
    kick: "Kick khỏi nhóm",
    ban: "Ban khỏi nhóm"
  };
  return labels[String(value || "").toLowerCase()] || String(value || "Chưa đặt");
}

export function layerContainsTable(layer: { tables: string[] }, tableKey: string) {
  return layer.tables.includes(tableKey);
}

export function loadCpState() {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }
  try {
    return JSON.parse(window.localStorage.getItem(CP_STATE_STORAGE_KEY) || "{}") as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

export function saveCpState(nextState: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CP_STATE_STORAGE_KEY, JSON.stringify(nextState));
}

