import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function readSettingsObject(settings: unknown) {
  if (!settings) return {} as Record<string, unknown>;
  if (typeof settings === "string") {
    try {
      const parsed = JSON.parse(settings);
      return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return typeof settings === "object" ? settings as Record<string, unknown> : {};
}

function parseButtons(rawText: string) {
  const inline_keyboard = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|", 2).map((part) => part?.trim());
      if (!label || !url) return null;
      return [{ text: label, url }];
    })
    .filter(Boolean);
  return inline_keyboard.length ? { inline_keyboard } : undefined;
}

function renderWelcomeText(template: string, groupName: string, chatId: string) {
  const previewUser = "<b>Người dùng mới</b>";
  return String(template || "Chào mừng {user} đến với {group}.")
    .replaceAll("{user}", previewUser)
    .replaceAll("{mention}", previewUser)
    .replaceAll("{group}", groupName || chatId)
    .replaceAll("{group_id}", chatId)
    .replaceAll("{user_id}", "000000");
}

async function persistRuntimeStatus(moduleRow: { id: number; settings?: unknown }, changes: Record<string, unknown>) {
  const supabaseAdmin = getSupabaseAdmin() as any;
  const settings = {
    ...readSettingsObject(moduleRow.settings),
    ...changes,
  };
  await supabaseAdmin
    .from("module_settings")
    .update({ settings })
    .eq("id", moduleRow.id);
}

async function writeAuditLog(payload: {
  bot_key: string;
  chat_id: string;
  action: string;
  details: string;
  target_user_id?: string;
}) {
  const supabaseAdmin = getSupabaseAdmin() as any;
  await supabaseAdmin.from("audit_logs").insert({
    bot_key: payload.bot_key,
    chat_id: payload.chat_id,
    actor_user_id: "admin_cp",
    action: payload.action,
    target_user_id: payload.target_user_id || "",
    details: payload.details,
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const botKey = String(body.bot_key || "").trim();
    const chatId = String(body.chat_id || "").trim();
    const groupName = String(body.group_name || "").trim();

    if (!botKey) return badRequest("Thiếu bot_key.");
    if (!chatId) return badRequest("Hãy chọn group để test Welcome.");

    const supabaseAdmin = getSupabaseAdmin() as any;
    const { data: botRow, error: botError } = await supabaseAdmin
      .from("bots")
      .select("bot_key,bot_token,name")
      .eq("bot_key", botKey)
      .eq("enabled", true)
      .limit(1)
      .maybeSingle();
    if (botError) throw new Error(botError.message);
    if (!botRow?.bot_token) return badRequest("Bot chưa có token hoặc đang tắt.");

    const { data: welcomeRow, error: welcomeError } = await supabaseAdmin
      .from("module_settings")
      .select("id,enabled,settings")
      .eq("bot_key", botKey)
      .eq("module_key", "welcome")
      .limit(1)
      .maybeSingle();
    if (welcomeError) throw new Error(welcomeError.message);
    if (!welcomeRow?.id) return badRequest("Welcome chưa có cấu hình.");
    if (welcomeRow.enabled === false) return badRequest("Module Welcome đang tắt.");

    const settings = readSettingsObject(welcomeRow.settings);
    if (String(settings.welcome_enabled ?? "true") === "false") {
      return badRequest("Tin chào đang tắt trong cấu hình Welcome.");
    }

    const text = renderWelcomeText(
      String(settings.welcome_text || "Chào mừng {user} đến với {group}."),
      groupName || chatId,
      chatId,
    );
    const replyMarkup = parseButtons(String(settings.welcome_buttons_text || ""));

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botRow.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });
    const telegramPayload = await telegramResponse.json();
    const nowIso = new Date().toISOString();

    if (!telegramResponse.ok || telegramPayload?.ok === false) {
      const errorMessage = String(telegramPayload?.description || "Telegram không gửi được tin test Welcome.");
      await writeAuditLog({
        bot_key: botKey,
        chat_id: chatId,
        action: "welcome_test_failed",
        details: `source=cp_direct_api,error=${errorMessage}`,
      });
      await persistRuntimeStatus(welcomeRow as { id: number; settings?: unknown }, {
        welcome_runtime_last_error_at: nowIso,
        welcome_runtime_last_error_message: errorMessage,
        welcome_runtime_last_chat_id: chatId,
        welcome_runtime_last_test_at: nowIso,
        welcome_runtime_last_test_source: "cp_direct_api",
      });
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    await writeAuditLog({
      bot_key: botKey,
      chat_id: chatId,
      action: "welcome_test_sent",
      details: `source=cp_direct_api,message_id=${String(telegramPayload?.result?.message_id || "")}`,
    });
    await persistRuntimeStatus(welcomeRow as { id: number; settings?: unknown }, {
      welcome_runtime_last_success_at: nowIso,
      welcome_runtime_last_chat_id: chatId,
      welcome_runtime_last_test_at: nowIso,
      welcome_runtime_last_test_message_id: String(telegramPayload?.result?.message_id || ""),
      welcome_runtime_last_test_source: "cp_direct_api",
    });

    return NextResponse.json({
      ok: true,
      message: "Đã gửi tin test Welcome vào group đang chọn. Lưu ý: test này đi trực tiếp từ CP, không tạo log trong Render runtime.",
      preview: text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể test Welcome.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
