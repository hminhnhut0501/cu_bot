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
    row.created_by,
    row.updated_by,
    row.source,
    row.action,
  ].some((value) => normalize(value).includes(needle));
}

function statusOf(row: Row) {
  return String(row.status || "").trim().toLowerCase() || "normal";
}

function sortKeyOf(row: Row, sortBy: string) {
  if (sortBy === "display_name") return normalize(row.display_name || row.username || row.user_id);
  if (sortBy === "status") return statusOf(row);
  if (sortBy === "updated_at") return String(row.updated_at || row.last_seen_at || row.created_at || "");
  return String(row.last_seen_at || row.updated_at || row.created_at || "");
}

function mergeMemberRows(activityRows: Row[], stateRows: Row[]) {
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
  return Array.from(map.values());
}

function seedRowsFromAudit(auditRows: Row[], supportedUsers: Set<string>) {
  const map = new Map<string, Row>();
  for (const row of auditRows) {
    const action = String(row.action || "").trim().toLowerCase();
    const userId = String(row.target_user_id || "").trim();
    const details = parseDetails(row.details);
    if (!userId) continue;
    if (!["member_joined", "member_join_request", "warn", "member_ban", "member_mute", "member_blacklist", "member_kick", "member_unban", "member_unmute", "member_unblacklist", "restrict", "ban", "kick", "unban"].includes(action)) {
      continue;
    }
    const isReleaseAction = ["member_unban", "member_unmute", "member_unblacklist", "unban"].includes(action);
    if (isReleaseAction && !supportedUsers.has(userId)) {
      continue;
    }
    const key = `${row.chat_id || ""}:${userId}`;
    const current = map.get(key);
    const next = {
      bot_key: row.bot_key || "main",
      chat_id: row.chat_id || "",
      user_id: userId,
      username: details.username || details.from_username || "",
      display_name: details.display_name || details.from_name || details.target_display_name || userId,
      status: action === "member_ban" || action === "ban"
        ? "banned"
        : action === "member_mute" || action === "restrict"
          ? "muted"
        : action === "member_blacklist"
          ? "blacklisted"
          : isReleaseAction
            ? "normal"
            : "normal",
      reason: details.reason || row.action || "",
      updated_by: row.actor_user_id || "audit",
      updated_at: row.created_at,
      last_seen_at: row.created_at,
      source: "audit",
      payload: {
        source: "audit_logs",
        action,
        seeded_from_audit: true,
      },
    };
    if (!current || String(next.updated_at || "").localeCompare(String(current.updated_at || "")) > 0) {
      map.set(key, next);
    }
  }
  return Array.from(map.values());
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

function sortModerationRows(rows: Row[]) {
  return [...rows].sort((left, right) =>
    String(right.last_seen_at || right.updated_at || "").localeCompare(String(left.last_seen_at || left.updated_at || ""))
  );
}

function blacklistScopeRank(row: Row) {
  const botKey = String(row.bot_key || "");
  const chatId = String(row.chat_id || "");
  if (botKey === "*" && chatId === "*") return 3;
  if (chatId === "*") return 2;
  return 1;
}

function dedupeBlacklistRows(rows: Row[]) {
  const map = new Map<string, Row>();
  for (const row of sortModerationRows(rows)) {
    const userId = String(row.user_id || row.target_user_id || "").trim();
    if (!userId) continue;
    const current = map.get(userId);
    if (!current || blacklistScopeRank(row) > blacklistScopeRank(current)) {
      map.set(userId, row);
    }
  }
  return sortModerationRows(Array.from(map.values()));
}

function applyMemberFilters(rows: Row[], filters: {
  search: string;
  status: string;
  source: string;
  reason: string;
  sortBy: string;
  sortDir: string;
}) {
  const normalized = rows.filter((row) => matchesSearch(row, filters.search));
  const filtered = normalized.filter((row) => {
    if (filters.status && filters.status !== "all") {
      const current = statusOf(row);
      if (filters.status === "normal") {
        if (current !== "normal") return false;
      } else if (current !== filters.status) {
        return false;
      }
    }
    if (filters.source && filters.source !== "all" && String(row.source || "").trim().toLowerCase() !== filters.source) {
      return false;
    }
    if (filters.reason && filters.reason !== "all") {
      const hasReason = Boolean(String(row.reason || row.payload?.reason || "").trim());
      if (filters.reason === "has_reason" && !hasReason) return false;
      if (filters.reason === "missing_reason" && hasReason) return false;
    }
    return true;
  });
  const sorted = [...filtered].sort((left, right) => {
    const leftKey = sortKeyOf(left, filters.sortBy);
    const rightKey = sortKeyOf(right, filters.sortBy);
    return filters.sortDir === "asc" ? leftKey.localeCompare(rightKey) : rightKey.localeCompare(leftKey);
  });
  return sorted;
}

function rowsForTab(args: {
  tab: string;
  members: Row[];
  active: Row[];
  muted: Row[];
  banned: Row[];
  blacklisted: Row[];
  logs: Row[];
}) {
  if (args.tab === "active") return args.active;
  if (args.tab === "muted") return args.muted;
  if (args.tab === "banned") return args.banned;
  if (args.tab === "blacklisted") return args.blacklisted;
  if (args.tab === "logs") return args.logs;
  return args.members;
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

function auditStatus(action: string) {
  if (action === "member_blacklist" || action === "member_blacklist_join_blocked") return "blacklisted";
  if (action === "member_ban" || action === "ban") return "banned";
  if (action === "member_mute" || action === "restrict") return "muted";
  if (action === "member_unblacklist" || action === "member_unban" || action === "member_unmute" || action === "unban") return "normal";
  return "";
}

function stateRowsWithAuditFallback(stateRows: Row[], auditRows: Row[]) {
  const map = new Map<string, Row>();
  for (const row of stateRows) {
    const key = `${row.bot_key || ""}:${row.chat_id || ""}:${row.user_id || ""}`;
    map.set(key, { ...row, source: row.source || "state" });
  }
  const latestAuditByMember = new Map<string, Row>();
  for (const row of auditRows) {
    const userId = String(row.target_user_id || "").trim();
    if (!userId) continue;
    const key = `${row.bot_key || ""}:${row.chat_id || ""}:${userId}`;
    if (!latestAuditByMember.has(key)) {
      latestAuditByMember.set(key, row);
    }
  }
  for (const [key, row] of latestAuditByMember.entries()) {
    if (map.has(key)) continue;
    const action = String(row.action || "").trim().toLowerCase();
    const status = auditStatus(action);
    if (!status || status === "normal") continue;
    const details = parseDetails(row.details);
    map.set(key, {
      bot_key: row.bot_key,
      chat_id: row.chat_id,
      user_id: row.target_user_id,
      username: details.username || details.target_username || "",
      display_name: details.display_name || details.target_display_name || row.target_user_id,
      status,
      reason: details.reason || action.replaceAll("_", " "),
      updated_by: row.actor_user_id || "audit",
      updated_at: row.created_at,
      last_seen_at: row.created_at,
      payload: { source: "audit_logs", action },
      source: "audit",
    });
  }
  return Array.from(map.values());
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const supabase = getSupabaseAdmin() as any;
    const botKey = request.nextUrl.searchParams.get("bot_key")?.trim() || "";
    const groupId = request.nextUrl.searchParams.get("group_id")?.trim() || "";
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const today = request.nextUrl.searchParams.get("date")?.trim() || vietnamDateKey();
    const tab = request.nextUrl.searchParams.get("tab")?.trim() || "all";
    const status = request.nextUrl.searchParams.get("status")?.trim() || "all";
    const source = request.nextUrl.searchParams.get("source")?.trim() || "all";
    const reason = request.nextUrl.searchParams.get("reason")?.trim() || "all";
    const sortBy = request.nextUrl.searchParams.get("sort_by")?.trim() || "last_seen_at";
    const sortDir = request.nextUrl.searchParams.get("sort_dir")?.trim() || "desc";
    const page = Math.max(Number(request.nextUrl.searchParams.get("page") || 1), 1);
    const pageSize = Math.min(Math.max(Number(request.nextUrl.searchParams.get("page_size") || 25), 1), 100);
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 200), 500);
    const isSystemBlacklist = botKey === "*" && !groupId;

    if (isSystemBlacklist) {
      const [
        { data: blacklistStateRows, error: blacklistStateError },
        { data: blacklistAuditRows, error: blacklistAuditError },
      ] = await Promise.all([
        supabase
          .from("member_moderation_state")
          .select("*")
          .eq("status", "blacklisted")
          .order("updated_at", { ascending: false })
          .range(0, 4999),
        supabase
          .from("audit_logs")
          .select("*")
          .in("action", [
            "member_joined",
            "member_join_request",
            "member_blacklist",
            "member_unblacklist",
            "member_blacklist_fanout",
            "member_unblacklist_fanout",
            "member_blacklist_join_blocked",
            "member_blacklist_join_block_failed",
            "warn",
          ])
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

      if (blacklistStateError) throw new Error(blacklistStateError.message);
      if (blacklistAuditError) throw new Error(blacklistAuditError.message);

      const blacklistAllRows = applyMemberFilters(dedupeBlacklistRows(blacklistStateRows || []), {
        search,
        status,
        source,
        reason,
        sortBy,
        sortDir,
      });
      const total = blacklistAllRows.length;
      const start = (page - 1) * pageSize;
      const blacklistRows = blacklistAllRows.slice(start, start + pageSize);
      const blacklistLogs = blacklistAuditRows || [];
      return NextResponse.json({
        date: today,
        scope: { botKey, groupId },
        filtersApplied: { tab, search, status, source, reason, sortBy, sortDir },
        summary: {
          activeToday: 0,
          visibleMembers: total,
          muted: 0,
          banned: 0,
          blacklisted: total,
          normalTracked: 0,
        },
        pagination: {
          page,
          pageSize,
          total,
          hasNextPage: start + pageSize < total,
          nextCursor: null,
        },
        meta: {
          lastUpdatedAt: blacklistRows[0]?.updated_at || blacklistLogs[0]?.created_at || today,
          queryMode: "mixed",
          snapshotMode: "snapshot",
        },
        members: rowsForTab({ tab, members: blacklistRows, active: [], muted: [], banned: [], blacklisted: blacklistRows, logs: blacklistLogs }),
        active: [],
        muted: [],
        banned: [],
        blacklisted: blacklistRows,
        logs: blacklistLogs,
      });
    }

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
    if (botKey && botKey !== "*") stateQuery = stateQuery.in("bot_key", [botKey, "*"]);
    if (groupId) stateQuery = stateQuery.in("chat_id", [groupId, "*"]);

    let auditQuery = supabase
      .from("audit_logs")
      .select("*")
      .in("action", [
        "member_joined",
        "member_join_request",
        "member_mute",
        "member_unmute",
        "member_ban",
        "member_unban",
        "member_kick",
        "member_blacklist",
        "member_unblacklist",
        "member_blacklist_fanout",
        "member_unblacklist_fanout",
        "member_blacklist_join_blocked",
        "member_blacklist_join_block_failed",
        "warn",
        "restrict",
        "ban",
        "kick",
        "unban",
      ])
      .order("created_at", { ascending: false })
      .limit(100);
    if (botKey && botKey !== "*") auditQuery = auditQuery.in("bot_key", [botKey, "*"]);
    if (groupId) auditQuery = auditQuery.in("chat_id", [groupId, "*"]);

    const [
      { data: activityRows, error: activityError },
      { data: stateRows, error: stateError },
      { data: auditRows, error: auditError },
    ] = await Promise.all([activityQuery, stateQuery, auditQuery]);

    if (activityError) throw new Error(activityError.message);
    if (stateError) throw new Error(stateError.message);
    if (auditError) throw new Error(auditError.message);

    const moderationRows = stateRowsWithAuditFallback(stateRows || [], auditRows || []);
    const supportedUsers = new Set<string>([
      ...(activityRows || []).map((row: Row) => String(row.user_id || "").trim()).filter(Boolean),
      ...(stateRows || []).map((row: Row) => String(row.user_id || "").trim()).filter(Boolean),
    ]);
    const auditSeeds = seedRowsFromAudit(auditRows || [], supportedUsers);
    const mergedMembers = mergeMemberRows(activityRows || [], moderationRows);
    const combinedMembers = mergeMemberRows(mergedMembers, auditSeeds);
    const filteredMembers = applyMemberFilters(combinedMembers, { search, status, source, reason, sortBy, sortDir });
    const total = filteredMembers.length;
    const start = (page - 1) * pageSize;
    const members = filteredMembers.slice(start, start + pageSize);
    const statuses = groupByStatus(moderationRows);
    const activeRows = (activityRows || []).filter((row: Row) => matchesSearch(row, search)).slice(0, limit);
    const mutedRows = statuses.muted.filter((row) => matchesSearch(row, search)).slice(0, limit);
    const bannedRows = statuses.banned.filter((row) => matchesSearch(row, search)).slice(0, limit);
    const blacklistedRows = statuses.blacklisted.filter((row) => matchesSearch(row, search)).slice(0, limit);
    const rows = rowsForTab({
      tab,
      members,
      active: activeRows,
      muted: mutedRows,
      banned: bannedRows,
      blacklisted: blacklistedRows,
      logs: auditRows || [],
    });

    return NextResponse.json({
      date: today,
      scope: { botKey, groupId },
      filtersApplied: { tab, search, status, source, reason, sortBy, sortDir },
      summary: {
        activeToday: (activityRows || []).length,
        visibleMembers: total,
        muted: statuses.muted.length,
        banned: statuses.banned.length,
        blacklisted: statuses.blacklisted.length,
        normalTracked: statuses.normal.length,
      },
      pagination: {
        page,
        pageSize,
        total,
        hasNextPage: start + pageSize < total,
        nextCursor: null,
      },
      meta: {
        lastUpdatedAt: members[0]?.last_seen_at || members[0]?.updated_at || auditRows?.[0]?.created_at || today,
        queryMode: "mixed",
        snapshotMode: "snapshot",
      },
      members: rows,
      active: activeRows,
      muted: mutedRows,
      banned: bannedRows,
      blacklisted: blacklistedRows,
      logs: auditRows || [],
    });
  } catch (error) {
    return serverError(error);
  }
}
