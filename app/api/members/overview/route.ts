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

function vietnamDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/^@/, "");
}

function matchesSearch(row: Row, search: string) {
  if (!search) return true;
  const needle = normalize(search);
  return [
    row.user_id,
    row.username,
    row.display_name,
    row.status,
    row.reason,
  ].some((value) => normalize(value).includes(needle));
}

function mergeMemberRows(activityRows: Row[], stateRows: Row[], search: string, limit: number) {
  const map = new Map<string, Row>();
  for (const row of activityRows) {
    const key = `${row.chat_id || ""}:${row.user_id || ""}`;
    map.set(key, {
      ...row,
      status: "normal",
      source: "activity",
    });
  }
  for (const row of stateRows) {
    const key = `${row.chat_id || ""}:${row.user_id || ""}`;
    map.set(key, {
      ...(map.get(key) || {}),
      ...row,
      source: map.has(key) ? "activity+state" : "state",
    });
  }
  return Array.from(map.values())
    .filter((row) => matchesSearch(row, search))
    .sort((left, right) => String(right.last_seen_at || right.updated_at || "").localeCompare(String(left.last_seen_at || left.updated_at || "")))
    .slice(0, limit);
}

function groupByStatus(rows: Row[]) {
  const statusOf = (row: Row) => String(row.status || "").trim().toLowerCase();
  return {
    muted: rows.filter((row) => statusOf(row) === "muted"),
    banned: rows.filter((row) => statusOf(row) === "banned"),
    blacklisted: rows.filter((row) => statusOf(row) === "blacklisted"),
    normal: rows.filter((row) => !statusOf(row) || statusOf(row) === "normal"),
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const supabase = getSupabaseAdmin() as any;
    const botKey = request.nextUrl.searchParams.get("bot_key")?.trim() || "";
    const groupId = request.nextUrl.searchParams.get("group_id")?.trim() || "";
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const today = request.nextUrl.searchParams.get("date")?.trim() || vietnamDateKey();
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 200), 500);

    let activityQuery = supabase
      .from("analytics_member_activity")
      .select("*")
      .eq("activity_date", today)
      .order("last_seen_at", { ascending: false })
      .limit(1000);
    if (botKey) activityQuery = activityQuery.eq("bot_key", botKey);
    if (groupId) activityQuery = activityQuery.eq("chat_id", groupId);

    let stateQuery = supabase
      .from("member_moderation_state")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (botKey) stateQuery = stateQuery.eq("bot_key", botKey);
    if (groupId) stateQuery = stateQuery.eq("chat_id", groupId);

    let auditQuery = supabase
      .from("audit_logs")
      .select("*")
      .in("action", [
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
        "kick",
        "unban",
      ])
      .order("created_at", { ascending: false })
      .limit(100);
    if (botKey) auditQuery = auditQuery.eq("bot_key", botKey);
    if (groupId) auditQuery = auditQuery.eq("chat_id", groupId);

    const [
      { data: activityRows, error: activityError },
      { data: stateRows, error: stateError },
      { data: auditRows, error: auditError },
    ] = await Promise.all([activityQuery, stateQuery, auditQuery]);

    if (activityError) throw new Error(activityError.message);
    if (stateError) throw new Error(stateError.message);
    if (auditError) throw new Error(auditError.message);

    const members = mergeMemberRows(activityRows || [], stateRows || [], search, limit);
    const statuses = groupByStatus(stateRows || []);

    return NextResponse.json({
      date: today,
      scope: { botKey, groupId },
      summary: {
        activeToday: (activityRows || []).length,
        visibleMembers: members.length,
        muted: statuses.muted.length,
        banned: statuses.banned.length,
        blacklisted: statuses.blacklisted.length,
        normalTracked: statuses.normal.length,
      },
      members,
      active: (activityRows || []).filter((row: Row) => matchesSearch(row, search)).slice(0, limit),
      muted: statuses.muted.filter((row) => matchesSearch(row, search)).slice(0, limit),
      banned: statuses.banned.filter((row) => matchesSearch(row, search)).slice(0, limit),
      blacklisted: statuses.blacklisted.filter((row) => matchesSearch(row, search)).slice(0, limit),
      logs: auditRows || [],
    });
  } catch (error) {
    return serverError(error);
  }
}
