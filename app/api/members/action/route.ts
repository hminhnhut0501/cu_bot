import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type MemberAction =
  | "mute"
  | "restrict"
  | "ban"
  | "kick"
  | "unban"
  | "unmute"
  | "blacklist"
  | "unblacklist";

type ActionBody = {
  bot_key?: string;
  chat_id?: string;
  user_id?: string;
  username?: string;
  display_name?: string;
  action?: MemberAction;
  reason?: string;
  duration_seconds?: number;
  dry_run?: boolean;
  actor_user_id?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

function normalizeAction(value: unknown): MemberAction | "" {
  const action = String(value || "").trim().toLowerCase();
  if (["mute", "restrict", "ban", "kick", "unban", "unmute", "blacklist", "unblacklist"].includes(action)) {
    return action as MemberAction;
  }
  return "";
}

function telegramMethodFor(action: MemberAction) {
  if (action === "mute" || action === "restrict") return "restrictChatMember";
  if (action === "unmute") return "restrictChatMember";
  if (action === "ban" || action === "blacklist" || action === "kick") return "banChatMember";
  if (action === "unban" || action === "unblacklist") return "unbanChatMember";
  return "";
}

function memberStatusFor(action: MemberAction) {
  if (action === "mute" || action === "restrict") return "muted";
  if (action === "ban") return "banned";
  if (action === "blacklist") return "blacklisted";
  return "normal";
}

function auditActionFor(action: MemberAction) {
  const map: Record<MemberAction, string> = {
    mute: "member_mute",
    restrict: "member_mute",
    ban: "member_ban",
    kick: "member_kick",
    unban: "member_unban",
    unmute: "member_unmute",
    blacklist: "member_blacklist",
    unblacklist: "member_unblacklist",
  };
  return map[action];
}

function untilDate(durationSeconds: number) {
  if (!durationSeconds || durationSeconds <= 0) return null;
  return new Date(Date.now() + durationSeconds * 1000).toISOString();
}

async function loadBotToken(supabase: any, botKey: string) {
  const { data, error } = await supabase
    .from("bots")
    .select("bot_key,bot_token,name")
    .eq("bot_key", botKey)
    .eq("enabled", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.bot_token ? String(data.bot_token) : "";
}

async function callTelegram(token: string, method: string, payload: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.description || `Telegram ${method} failed (${response.status})`);
  }
  return data;
}

function telegramPayload(action: MemberAction, chatId: string, userId: string, durationSeconds: number) {
  const until = durationSeconds > 0 ? Math.floor(Date.now() / 1000) + durationSeconds : undefined;
  if (action === "mute" || action === "restrict") {
    return {
      chat_id: chatId,
      user_id: userId,
      until_date: until,
      permissions: { can_send_messages: false },
      use_independent_chat_permissions: true,
    };
  }
  if (action === "unmute") {
    return {
      chat_id: chatId,
      user_id: userId,
      permissions: {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
      },
      use_independent_chat_permissions: true,
    };
  }
  if (action === "ban" || action === "blacklist") {
    return {
      chat_id: chatId,
      user_id: userId,
      until_date: until,
    };
  }
  if (action === "kick") {
    return {
      chat_id: chatId,
      user_id: userId,
    };
  }
  return {
    chat_id: chatId,
    user_id: userId,
    only_if_banned: false,
  };
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const body = (await request.json()) as ActionBody;
    const botKey = String(body.bot_key || "main").trim();
    const chatId = String(body.chat_id || "").trim();
    const userId = String(body.user_id || "").trim();
    const action = normalizeAction(body.action);
    const reason = String(body.reason || "").trim() || "Admin CP member action";
    const durationSeconds = Math.max(0, Number(body.duration_seconds || 0));
    const actor = String(body.actor_user_id || "admin_cp");
    const dryRun = Boolean(body.dry_run);

    if (!botKey) return badRequest("Thiếu bot_key.");
    if (!chatId) return badRequest("Thiếu chat_id.");
    if (!userId) return badRequest("Thiếu user_id.");
    if (!action) return badRequest("Hành động không được hỗ trợ.");

    const supabase = getSupabaseAdmin() as any;
    const method = telegramMethodFor(action);
    const tgPayload = telegramPayload(action, chatId, userId, durationSeconds);
    let telegramResult: Record<string, unknown> = dryRun ? { dry_run: true } : {};
    let telegramError = "";

    if (!dryRun) {
      const token = await loadBotToken(supabase, botKey);
      if (!token) return badRequest("Bot chưa có token hoặc đang tắt.");
      try {
        telegramResult = await callTelegram(token, method, tgPayload);
        if (action === "kick") {
          await callTelegram(token, "unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true });
        }
      } catch (error) {
        telegramError = error instanceof Error ? error.message : "Telegram action failed.";
        if (action !== "blacklist" && action !== "unblacklist") {
          throw error;
        }
      }
    }

    const now = new Date().toISOString();
    const status = memberStatusFor(action);
    const untilAt = untilDate(durationSeconds);
    const statePayload = {
      bot_key: botKey,
      chat_id: chatId,
      user_id: userId,
      username: String(body.username || ""),
      display_name: String(body.display_name || ""),
      status,
      reason,
      until_at: status === "normal" ? null : untilAt,
      created_by: actor,
      updated_by: actor,
      updated_at: now,
      last_seen_at: now,
      payload: {
        action,
        duration_seconds: durationSeconds,
        dry_run: dryRun,
        telegram_method: method,
        telegram_error: telegramError || undefined,
      },
    };

    const { data: stateRow, error: stateError } = await supabase
      .from("member_moderation_state")
      .upsert(statePayload, { onConflict: "bot_key,chat_id,user_id" })
      .select("*")
      .single();
    if (stateError) throw new Error(stateError.message);

    const auditDetails = {
      reason,
      trigger: "admin_cp",
      member_status: status,
      duration_seconds: durationSeconds,
      until_at: untilAt,
      dry_run: dryRun,
      telegram_method: method,
      telegram_error: telegramError || undefined,
    };
    await supabase.from("audit_logs").insert({
      bot_key: botKey,
      chat_id: chatId,
      actor_user_id: actor,
      action: auditActionFor(action),
      target_user_id: userId,
      details: JSON.stringify(auditDetails),
    });

    return NextResponse.json({
      ok: true,
      dryRun,
      action,
      telegram: telegramResult,
      telegramError,
      row: stateRow,
    });
  } catch (error) {
    return serverError(error);
  }
}
