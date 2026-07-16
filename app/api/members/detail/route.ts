import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/^@/, "");
}

function parseDetails(value: unknown) {
  if (!value) return {} as Row;
  if (typeof value === "object") return value as Row;
  try {
    return JSON.parse(String(value)) as Row;
  } catch {
    return {} as Row;
  }
}

function statusOf(action: string) {
  if (action === "member_blacklist" || action === "member_blacklist_join_blocked") return "blacklisted";
  if (action === "member_ban" || action === "ban" || action === "member_kick") return "banned";
  if (action === "member_mute" || action === "restrict") return "muted";
  if (action === "member_unblacklist" || action === "member_unban" || action === "member_unmute" || action === "unban") return "normal";
  return "";
}

function timelineLabel(action: string) {
  const labels: Record<string, string> = {
    member_joined: "Join group",
    member_left: "Rời group",
    member_join_request: "Xin vào group",
    member_mute: "Mute",
    member_unmute: "Mở chat",
    member_ban: "Ban",
    member_unban: "Gỡ ban",
    member_kick: "Kick",
    member_blacklist: "Blacklist",
    member_unblacklist: "Gỡ blacklist",
    member_blacklist_join_blocked: "Chặn join blacklist",
    member_blacklist_join_block_failed: "Lỗi chặn join",
    restrict: "Restrict",
    ban: "Ban",
    unban: "Unban",
  };
  return labels[action] || action.replaceAll("_", " ");
}

function noteFromRow(row: Row) {
  const details = parseDetails(row.details);
  const text = String(details.admin_note || details.note || details.reason || row.reason || row.admin_note || "").trim();
  if (!text) return null;
  return {
    id: String(row.id || `${row.created_at || row.updated_at || ""}-${row.action || "note"}`),
    text,
    created_at: String(row.created_at || row.updated_at || row.last_seen_at || ""),
    created_by: String(row.actor_user_id || row.updated_by || row.created_by || ""),
    source: String(row.action || "audit"),
  };
}

function sortNotes(notes: Array<{ created_at: string }>) {
  return [...notes].sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const supabase = getSupabaseAdmin() as any;
    const botKey = request.nextUrl.searchParams.get("bot_key")?.trim() || "";
    const groupId = request.nextUrl.searchParams.get("group_id")?.trim() || "";
    const userId = request.nextUrl.searchParams.get("user_id")?.trim() || "";

    if (!userId) {
      return NextResponse.json({ error: "Thiếu user_id." }, { status: 400 });
    }

    const [
      { data: stateRows, error: stateError },
      { data: activityRows, error: activityError },
      { data: auditRows, error: auditError },
    ] = await Promise.all([
      (() => {
        let query = supabase.from("member_moderation_state").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(20);
        if (botKey) query = query.in("bot_key", [botKey, "*"]);
        if (groupId) query = query.in("chat_id", [groupId, "*"]);
        return query;
      })(),
      supabase
        .from("analytics_member_activity")
        .select("*")
        .eq("user_id", userId)
        .order("last_seen_at", { ascending: false })
        .limit(20),
      (() => {
        let query = supabase
          .from("audit_logs")
          .select("*")
          .in("action", [
            "member_joined",
            "member_left",
            "member_join_request",
            "member_mute",
            "member_unmute",
            "member_ban",
            "member_unban",
            "member_kick",
            "member_blacklist",
            "member_unblacklist",
            "member_blacklist_join_blocked",
            "member_blacklist_join_block_failed",
            "restrict",
            "ban",
            "unban",
          ])
          .eq("target_user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (botKey) query = query.in("bot_key", [botKey, "*"]);
        if (groupId) query = query.in("chat_id", [groupId, "*"]);
        return query;
      })(),
    ]);

    if (stateError) throw new Error(stateError.message);
    if (activityError) throw new Error(activityError.message);
    if (auditError) throw new Error(auditError.message);

    const member = (stateRows || [])[0] || (activityRows || [])[0] || null;
    const latestState = (stateRows || [])[0] || null;
    const status = statusOf(String(latestState?.status || ""));
    const timeline = [
      ...(stateRows || []).map((row: Row) => ({
        type: String(row.status || "note"),
        at: String(row.updated_at || row.created_at || ""),
        actor: String(row.updated_by || row.created_by || ""),
        reason: String(row.reason || ""),
        source: "state",
        label: timelineLabel(String(row.status || "")),
        payload: parseDetails(row.payload),
      })),
      ...(activityRows || []).map((row: Row) => ({
        type: "activity",
        at: String(row.last_seen_at || row.first_seen_at || ""),
        actor: "",
        reason: `Đã ghi nhận ${row.message_count || 1} hoạt động`,
        source: "activity",
        label: "Hoạt động",
        payload: parseDetails(row.payload),
      })),
      ...(auditRows || []).map((row: Row) => {
        const details = parseDetails(row.details);
        return {
          type: String(row.action || "audit"),
          at: String(row.created_at || ""),
          actor: String(row.actor_user_id || ""),
          reason: String(details.reason || row.action || ""),
          source: "audit",
          label: timelineLabel(String(row.action || "")),
          payload: details,
        };
      }),
    ]
      .filter((item) => item.at)
      .sort((left, right) => String(right.at).localeCompare(String(left.at)));

    const noteRows = [
      ...(stateRows || []).flatMap((row: Row) => {
        const payload = parseDetails(row.payload);
        const text = String(payload.note || payload.notes || payload.admin_note || row.reason || "").trim();
        if (!text) return [];
        return [{
          id: String(row.id || `${row.updated_at || row.created_at || ""}-state-note`),
          text,
          created_at: String(row.updated_at || row.created_at || ""),
          created_by: String(row.updated_by || row.created_by || ""),
          source: "state",
        }];
      }),
      ...(auditRows || []).map(noteFromRow).filter(Boolean),
    ].filter((item): item is NonNullable<typeof item> => Boolean(item?.text));
    const notes = sortNotes(noteRows as Array<{ created_at: string }>);

    return NextResponse.json({
      scope: { botKey, groupId, userId },
      member: {
        ...(member || {}),
        status: status || String(member?.status || "normal"),
        username: String(member?.username || activityRows?.[0]?.username || ""),
        display_name: String(member?.display_name || activityRows?.[0]?.display_name || member?.user_id || userId),
      },
      stats: {
        joinCount: (auditRows || []).filter((row: Row) => String(row.action || "") === "member_joined").length,
        leaveCount: (auditRows || []).filter((row: Row) => String(row.action || "") === "member_left").length,
        actionCount: (auditRows || []).length,
        lastActionAt: (auditRows || [])[0]?.created_at || "",
      },
      timeline,
      notes,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const supabase = getSupabaseAdmin() as any;
    const body = await request.json().catch(() => ({}));
    const botKey = String(body.bot_key || "").trim();
    const groupId = String(body.group_id || "").trim();
    const userId = String(body.user_id || "").trim();
    const note = String(body.note || "").trim();
    const actor = String(body.actor_user_id || "admin_cp").trim();

    if (!userId) return NextResponse.json({ error: "Thiếu user_id." }, { status: 400 });
    if (!note) return NextResponse.json({ error: "Thiếu note." }, { status: 400 });

    let stateQuery = supabase.from("member_moderation_state").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1);
    if (botKey) stateQuery = stateQuery.in("bot_key", [botKey, "*"]);
    if (groupId) stateQuery = stateQuery.in("chat_id", [groupId, "*"]);
    const { data: stateRows, error: stateError } = await stateQuery;
    if (stateError) throw new Error(stateError.message);

    const current = (stateRows || [])[0];
    if (!current) {
      return NextResponse.json({ error: "Chưa có hồ sơ member để ghi chú." }, { status: 404 });
    }

    const payload = parseDetails(current.payload);
    const notes = Array.isArray(payload.notes) ? payload.notes : [];
    const nextNote = {
      id: `${Date.now()}`,
      text: note,
      created_at: new Date().toISOString(),
      created_by: actor,
      source: "manual",
    };
    const nextPayload = {
      ...payload,
      notes: [nextNote, ...notes].slice(0, 20),
      note,
      note_updated_at: nextNote.created_at,
      note_updated_by: actor,
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("member_moderation_state")
      .update({
        payload: JSON.stringify(nextPayload),
        updated_at: nextNote.created_at,
        updated_by: actor,
      })
      .eq("id", current.id)
      .select("*");
    if (updateError) throw new Error(updateError.message);

    await supabase.from("audit_logs").insert({
      bot_key: current.bot_key || botKey || "main",
      chat_id: current.chat_id || groupId || null,
      actor_user_id: actor,
      action: "member_note",
      target_user_id: userId,
      details: JSON.stringify({
        reason: note,
        note,
        source: "manual_note",
        scope: {
          bot_key: current.bot_key || botKey || "",
          chat_id: current.chat_id || groupId || "",
        },
      }),
    });

    return NextResponse.json({
      ok: true,
      row: (updatedRows || [])[0] || current,
      note: nextNote,
    });
  } catch (error) {
    return serverError(error);
  }
}
