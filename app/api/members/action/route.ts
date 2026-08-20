import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

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

type ActionTrace = {
  request: {
    bot_key: string;
    chat_id: string;
    user_id: string;
    action: MemberAction | "";
    reason: string;
    duration_seconds: number;
    dry_run: boolean;
    actor_user_id: string;
  };
  telegram: {
    method: string;
    payload: Record<string, unknown>;
    attempted: boolean;
    ok: boolean;
    error: string;
    result: Record<string, unknown>;
  };
  state: {
    status: string;
    deleted: number;
    row_count: number;
    scope: string;
    attempted_scopes?: Array<{ bot_key: string; chat_id: string; status: string }> | null;
    matched_scopes?: Array<{ bot_key: string; chat_id: string; status: string }> | null;
  };
  audit: {
    action: string;
    inserted: boolean;
  };
  fanout?: {
    attempted: number;
    ok: number;
    failed: number;
  } | null;
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

async function loadEnabledBots(supabase: any) {
  const { data, error } = await supabase
    .from("bots")
    .select("bot_key,bot_token,name,enabled")
    .eq("enabled", true);
  if (error) throw new Error(error.message);
  return (data || []).filter((row: Row) => String(row.bot_token || "").trim());
}

async function loadEnabledGroups(supabase: any) {
  const { data, error } = await supabase
    .from("groups")
    .select("bot_key,group_id,group_name,enabled")
    .neq("group_id", "");
  if (error) throw new Error(error.message);
  return (data || []).filter((row: Row) => row.enabled !== false && String(row.group_id || "").trim());
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

async function fanoutSystemBlacklistAction(supabase: any, action: MemberAction, userId: string) {
  const bots = await loadEnabledBots(supabase);
  const groups = await loadEnabledGroups(supabase);
  const method = action === "unblacklist" ? "unbanChatMember" : "banChatMember";
  const results: Row[] = [];
  for (const bot of bots) {
    const botKey = String(bot.bot_key || "").trim();
    const token = String(bot.bot_token || "").trim();
    const botGroups = groups.filter((group: Row) => String(group.bot_key || "main").trim() === botKey);
    for (const group of botGroups) {
      const chatId = String(group.group_id || "").trim();
      try {
        await callTelegram(token, method, {
          chat_id: chatId,
          user_id: userId,
          ...(action === "unblacklist" ? { only_if_banned: false } : {}),
        });
        results.push({ bot_key: botKey, chat_id: chatId, ok: true });
      } catch (error) {
        results.push({
          bot_key: botKey,
          chat_id: chatId,
          ok: false,
          error: error instanceof Error ? error.message : "Telegram action failed.",
        });
      }
    }
  }
  return {
    attempted: results.length,
    ok: results.filter((row) => row.ok).length,
    failed: results.filter((row) => !row.ok).length,
    results,
  };
}

function unbanAttemptScopes(botKey: string, chatId: string) {
  const scopes = [
    { bot_key: botKey, chat_id: chatId, status: "banned" },
  ];
  if (botKey !== "*") {
    scopes.push({ bot_key: "*", chat_id: chatId, status: "banned" });
  }
  if (chatId !== "*") {
    scopes.push({ bot_key: botKey, chat_id: "*", status: "banned" });
  }
  if (botKey !== "*" && chatId !== "*") {
    scopes.push({ bot_key: "*", chat_id: "*", status: "banned" });
  }
  return scopes;
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

function isPersistentListAction(action: MemberAction) {
  return action === "blacklist" || action === "unblacklist";
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
    let fanoutResult: Row | null = null;
    let telegramAttempted = Boolean(!dryRun && !isPersistentListAction(action));
    let telegramOk = dryRun || isPersistentListAction(action);

    if (!dryRun && !isPersistentListAction(action)) {
      const token = await loadBotToken(supabase, botKey);
      if (!token) {
        return badRequest("Bot chưa có token hoặc đang tắt.");
      }
      try {
        telegramResult = await callTelegram(token, method, tgPayload);
        telegramOk = true;
        if (action === "kick") {
          await callTelegram(token, "unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true });
        }
      } catch (error) {
        telegramError = error instanceof Error ? error.message : "Telegram action failed.";
        telegramOk = false;
        if (action === "unban") {
          const trace: ActionTrace = {
            request: {
              bot_key: botKey,
              chat_id: chatId,
              user_id: userId,
              action,
              reason,
              duration_seconds: durationSeconds,
              dry_run: dryRun,
              actor_user_id: actor,
            },
            telegram: {
              method,
              payload: tgPayload,
              attempted: telegramAttempted,
              ok: false,
              error: telegramError,
              result: telegramResult,
            },
            state: {
              status: "banned",
              deleted: 0,
              row_count: 0,
              scope: "chat",
            },
            audit: {
              action: auditActionFor(action),
              inserted: false,
            },
          };
          return NextResponse.json(
            {
              ok: false,
              action,
              telegram: telegramResult,
              telegramError,
              error: `Gỡ ban thất bại: ${telegramError}`,
              debug: trace,
            },
            { status: 502 }
          );
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
      } as Row,
    };
    const statePayloads = [statePayload];
    if (isPersistentListAction(action) && chatId !== "*") {
      statePayloads.push({
        ...statePayload,
        chat_id: "*",
        payload: {
          ...statePayload.payload,
          scope: "bot_global",
          scoped_chat_id: chatId,
        },
      });
    }
    if (isPersistentListAction(action) && botKey !== "*") {
      statePayloads.push({
        ...statePayload,
        bot_key: "*",
        chat_id: "*",
        payload: {
          ...statePayload.payload,
          scope: "system_global",
          scoped_bot_key: botKey,
          scoped_chat_id: chatId,
        },
      });
    }

    let stateRows: Row[] = [];
    let attemptedScopes: Array<{ bot_key: string; chat_id: string; status: string }> | null = null;
    if (action === "unblacklist" || action === "unban") {
      if (action === "unblacklist" && botKey === "*" && chatId === "*") {
        const { data, error } = await supabase
          .from("member_moderation_state")
          .delete()
          .eq("user_id", userId)
          .eq("status", "blacklisted")
          .select("*");
        if (error) throw new Error(error.message);
        stateRows = data || [];
      } else if (action === "unban") {
        attemptedScopes = unbanAttemptScopes(botKey, chatId);
        const { data, error } = await supabase
          .from("member_moderation_state")
          .delete()
          .in("bot_key", [botKey, "*"])
          .in("chat_id", [chatId, "*"])
          .eq("user_id", userId)
          .eq("status", "banned")
          .select("*");
        if (error) throw new Error(error.message);
        stateRows = data || [];
      } else {
        for (const payload of statePayloads) {
          const { data, error } = await supabase
            .from("member_moderation_state")
            .delete()
            .eq("bot_key", payload.bot_key)
            .eq("chat_id", payload.chat_id)
            .eq("user_id", payload.user_id)
            .select("*");
          if (error) throw new Error(error.message);
          stateRows = [...stateRows, ...(data || [])];
        }
      }
    } else {
      const { data, error } = await supabase
        .from("member_moderation_state")
        .upsert(statePayloads, { onConflict: "bot_key,chat_id,user_id" })
        .select("*");
      if (error) throw new Error(error.message);
      stateRows = data || [];
    }
    const stateRow =
      stateRows.find((row: Row) => row.bot_key === "*" && row.chat_id === "*") ||
      stateRows.find((row: Row) => row.chat_id === "*") ||
      stateRows[0] ||
      { ...statePayload, status: "normal" };
    const matchedScopes = stateRows.map((row: Row) => ({
      bot_key: String(row.bot_key || ""),
      chat_id: String(row.chat_id || ""),
      status: String(row.status || ""),
    }));

    const auditDetails = {
      reason,
      trigger: "admin_cp",
      member_status: status,
      duration_seconds: durationSeconds,
      until_at: untilAt,
      dry_run: dryRun,
      telegram_method: method,
      telegram_error: telegramError || undefined,
      scope: isPersistentListAction(action) ? (botKey === "*" ? "system_global" : "bot_global") : "chat",
      scoped_chat_id: chatId,
      scoped_bot_key: botKey,
    };
    const auditInsert = await supabase.from("audit_logs").insert({
      bot_key: isPersistentListAction(action) && botKey === "*" ? "*" : botKey,
      chat_id: isPersistentListAction(action) ? "*" : chatId,
      actor_user_id: actor,
      action: auditActionFor(action),
      target_user_id: userId,
      details: JSON.stringify(auditDetails),
    });
    const auditInserted = !auditInsert.error;

    if (!dryRun && isPersistentListAction(action)) {
      try {
        if (botKey === "*") {
          fanoutResult = await fanoutSystemBlacklistAction(supabase, action, userId);
          telegramResult = { system_fanout: fanoutResult };
          if (fanoutResult.attempted === 0) {
            telegramError = action === "unblacklist"
              ? "Đã gỡ blacklist hệ thống nhưng chưa có bot/group bật để unban ngay."
              : "Blacklist hệ thống đã lưu nhưng chưa có bot/group bật để ban ngay.";
          } else if (fanoutResult.failed > 0) {
            telegramError = action === "unblacklist"
              ? `Đã gỡ blacklist hệ thống; unban ngay OK ${fanoutResult.ok}/${fanoutResult.attempted}, lỗi ${fanoutResult.failed}.`
              : `Đã lưu blacklist hệ thống; ban ngay OK ${fanoutResult.ok}/${fanoutResult.attempted}, lỗi ${fanoutResult.failed}.`;
          }
        } else {
          const token = await loadBotToken(supabase, botKey);
          if (!token) {
            telegramError = "Bot chưa có token hoặc đang tắt.";
          } else {
            telegramResult = await callTelegram(token, method, tgPayload);
          }
        }
      } catch (error) {
        telegramError = error instanceof Error ? error.message : "Telegram action failed.";
      }
    }

    if (fanoutResult) {
      await supabase.from("audit_logs").insert({
        bot_key: "*",
        chat_id: "*",
        actor_user_id: actor,
        action: action === "unblacklist" ? "member_unblacklist_fanout" : "member_blacklist_fanout",
        target_user_id: userId,
        details: JSON.stringify({
          reason,
          trigger: "admin_cp",
          member_status: status,
          scope: "system_global",
          attempted: fanoutResult.attempted,
          ok: fanoutResult.ok,
          failed: fanoutResult.failed,
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      action,
      telegram: telegramResult,
      telegramError,
      fanout: fanoutResult,
      stateDeleted: action === "unban" ? stateRows.length : 0,
      row: stateRow,
      rows: stateRows || [],
      debug: {
        request: {
          bot_key: botKey,
          chat_id: chatId,
          user_id: userId,
          action,
          reason,
          duration_seconds: durationSeconds,
          dry_run: dryRun,
          actor_user_id: actor,
        },
        telegram: {
          method,
          payload: tgPayload,
          attempted: telegramAttempted,
          ok: telegramOk,
          error: telegramError,
          result: telegramResult,
        },
        state: {
          status,
          deleted: action === "unban" ? stateRows.length : 0,
          row_count: stateRows.length,
          scope: isPersistentListAction(action) ? (botKey === "*" ? "system_global" : "bot_global") : "chat",
          attempted_scopes: action === "unban" ? attemptedScopes : null,
          matched_scopes: action === "unban" ? matchedScopes : null,
        },
        audit: {
          action: auditActionFor(action),
          inserted: auditInserted,
        },
        fanout: fanoutResult
          ? {
              attempted: fanoutResult.attempted,
              ok: fanoutResult.ok,
              failed: fanoutResult.failed,
            }
          : null,
      } satisfies ActionTrace,
    });
  } catch (error) {
    return serverError(error);
  }
}
