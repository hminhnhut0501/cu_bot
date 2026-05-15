import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs");
const outputPath = path.join(outputDir, "cu_bot_google_sheet_template.xlsx");

const workbook = Workbook.create();
const sheets = {
  README: workbook.worksheets.add("README"),
  groups: workbook.worksheets.add("groups"),
  config: workbook.worksheets.add("config"),
  messages: workbook.worksheets.add("messages"),
  keywords: workbook.worksheets.add("keywords"),
  admins: workbook.worksheets.add("admins"),
  bot_allowlist: workbook.worksheets.add("bot_allowlist"),
  video_messages: workbook.worksheets.add("video_messages"),
};

function writeMatrix(sheetName, address, values) {
  workbook.worksheets.getItem(sheetName).getRange(address).values = values;
}

writeMatrix("README", "A1:D14", [
  ["CU BOT - GOOGLE SHEET TEMPLATE", "", "", ""],
  ["Huong dan nhanh", "", "", ""],
  ["1", "Upload file nay len Google Sheets", "File > Import > Upload", ""],
  ["2", "Giu nguyen ten tab", "groups/config/messages/keywords/admins/bot_allowlist/video_messages", ""],
  ["3", "Vao File > Share > Publish to web", "Chon tung tab va dinh dang CSV", ""],
  ["4", "Copy tung link CSV vao bien moi truong", "GROUPS_CSV_URL, CONFIG_CSV_URL, ...", ""],
  ["5", "Sau khi sua sheet", "Dung /reload trong group de bot doc lai cache", ""],
  ["", "", "", ""],
  ["Luu y", "Bot phai la admin group de xoa tin/ban user/xoa bot la", "", ""],
  ["Luu y", "group_id thuong co dang -100xxxxxxxxxx", "", ""],
  ["Luu y", "Gia tri enabled nen de true/false", "", ""],
  ["Luu y", "pool giup tach nhom noi dung cho tung group", "", ""],
  ["Luu y", "video an danh dung copy_message, bot phai doc duoc source chat", "", ""],
  ["", "", "", ""],
]);

writeMatrix("groups", "A1:AF4", [
  [
    "group_id",
    "group_name",
    "enabled",
    "moderation_enabled",
    "delete_system_messages",
    "delete_forwarded_messages",
    "delete_inline_keyboard_messages",
    "delete_messages_from_bots",
    "remove_unknown_bots",
    "scan_bio_links",
    "bio_scan_cache_seconds",
    "bio_link_restrict_seconds",
    "bio_link_warning_text",
    "exempt_admins",
    "spam_max_messages",
    "spam_window_seconds",
    "spam_action",
    "forward_action",
    "inline_keyboard_action",
    "ban_after_warnings",
    "warning_text",
    "daily_enabled",
    "daily_window_start",
    "daily_window_end",
    "send_if_silent",
    "message_pool",
    "video_enabled",
    "video_window_start",
    "video_window_end",
    "video_pool",
    "policy_text",
    "notes",
  ],
  [
    "-1001234567890",
    "Group chinh",
    "true",
    "true",
    "true",
    "true",
    "true",
    "true",
    "true",
    "true",
    3600,
    0,
    "{mention} vui long go link Telegram trong bio roi lien he admin de mo chat lai.",
    "true",
    6,
    12,
    "warn",
    "warn",
    "warn",
    3,
    "Canh bao: {reason} ({count}/{limit})",
    "true",
    "20:00",
    "23:59",
    "false",
    "default",
    "true",
    "21:00",
    "23:00",
    "default",
    "",
    "Doi group_id thanh group that",
  ],
  [
    "-1002222222222",
    "Group phu",
    "false",
    "true",
    "true",
    "true",
    "true",
    "true",
    "true",
    "true",
    3600,
    0,
    "{mention} vui long go link Telegram trong bio roi lien he admin de mo chat lai.",
    "true",
    8,
    15,
    "delete",
    "delete",
    "warn",
    3,
    "Canh bao: {reason} ({count}/{limit})",
    "true",
    "19:00",
    "22:00",
    "true",
    "sales",
    "false",
    "21:00",
    "23:00",
    "default",
    "",
    "Dong mau, co the xoa",
  ],
  ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
]);

writeMatrix("config", "A1:C30", [
  ["key", "value", "enabled"],
  ["policy_text", "Noi quy nhom:\\n1. Ton trong thanh vien.\\n2. Khong spam/quang cao.\\n3. Khong forward bai co nut bam.\\n4. Tuan thu quan tri vien.", "true"],
  ["delete_system_messages", "true", "true"],
  ["delete_forwarded_messages", "true", "true"],
  ["delete_inline_keyboard_messages", "true", "true"],
  ["delete_messages_from_bots", "true", "true"],
  ["remove_unknown_bots", "true", "true"],
  ["scan_bio_links", "true", "true"],
  ["bio_scan_cache_seconds", "3600", "true"],
  ["bio_link_restrict_seconds", "0", "true"],
  ["bio_link_warning_text", "{mention} vui long go link Telegram trong bio roi lien he admin de mo chat lai.", "true"],
  ["exempt_admins", "true", "true"],
  ["spam_max_messages", "6", "true"],
  ["spam_window_seconds", "12", "true"],
  ["spam_action", "warn", "true"],
  ["forward_warning_reason", "Không được forward video/bài vào nhóm.", "true"],
  ["forward_warning_text", "{mention} vui lòng không forward video/bài vào nhóm. ({count}/{limit})", "true"],
  ["media_spam_max_messages", "3", "true"],
  ["media_spam_window_seconds", "10", "true"],
  ["media_spam_action", "restrict", "true"],
  ["spam_restrict_seconds", "300", "true"],
  ["bio_link_notice_delete_seconds", "30", "true"],
  ["spam_notice_delete_seconds", "20", "true"],
  ["forward_action", "warn", "true"],
  ["inline_keyboard_action", "warn", "true"],
  ["ban_after_warnings", "3", "true"],
  ["daily_window_start", "20:00", "true"],
  ["daily_window_end", "23:59", "true"],
  ["send_if_silent", "false", "true"],
  ["send_on_boot", "false", "true"],
]);

writeMatrix("messages", "A1:D8", [
  ["message", "pool", "weight", "enabled"],
  ["Chao ca nha, chuc moi nguoi mot ngay vui ve.", "default", 1, "true"],
  ["Nhac nhe: doc noi quy truoc khi dang bai nhe.", "default", 1, "true"],
  ["Hom nay ai co tin gi hay thi chia se nao.", "default", 2, "true"],
  ["Cam on moi nguoi da giu group sach va van minh.", "default", 1, "true"],
  ["Tin danh rieng cho group sales.", "sales", 1, "true"],
  ["Noi dung nay dang tam tat.", "default", 1, "false"],
  ["", "", "", ""],
]);

writeMatrix("keywords", "A1:E9", [
  ["keyword", "match", "action", "reason", "enabled"],
  ["casino", "contains", "warn", "Tu khoa cam", "true"],
  ["telegram.me/", "contains", "delete", "Link spam", "true"],
  ["t.me/spam", "contains", "ban", "Link spam nang", "true"],
  ["free money", "contains", "warn", "Noi dung spam", "true"],
  ["telegram\\.me/", "regex", "delete", "Regex mau", "false"],
  ["", "", "", "", ""],
  ["", "", "", "", ""],
  ["", "", "", "", ""],
]);

writeMatrix("admins", "A1:C5", [
  ["user_id", "chat_id", "enabled"],
  ["123456789", "-1001234567890", "true"],
  ["", "", ""],
  ["", "", ""],
  ["", "", ""],
]);

writeMatrix("bot_allowlist", "A1:D5", [
  ["bot_id", "username", "chat_id", "enabled"],
  ["123456789", "helpful_bot", "-1001234567890", "true"],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
]);

writeMatrix("video_messages", "A1:F6", [
  ["from_chat_id", "message_id", "caption", "pool", "weight", "enabled"],
  ["-1009876543210", "456", "Video hom nay", "default", 1, "true"],
  ["-1009876543210", "789", "", "default", 2, "true"],
  ["", "", "", "", "", ""],
  ["", "", "", "", "", ""],
  ["", "", "", "", "", ""],
]);

for (const [sheetName, sheet] of Object.entries(sheets)) {
  const used = sheet.getUsedRange?.();
  if (used) {
    used.format.font.name = "Arial";
    used.format.font.size = 10;
  }
  const header = sheet.getRange("A1:AZ1");
  header.format.font.bold = true;
  header.format.fill.color = "#1f4e78";
  header.format.font.color = "#ffffff";
}

sheets.README.getRange("A1:D1").format.font.size = 16;
sheets.README.getRange("A1:D1").format.font.bold = true;
sheets.README.getRange("A1:D1").format.fill.color = "#0f766e";
sheets.README.getRange("A1:D1").format.font.color = "#ffffff";

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(outputPath);
