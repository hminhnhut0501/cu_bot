import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type AuditRow = {
  bot_key?: string | null;
  action?: string | null;
  target_user_id?: string | null;
  chat_id?: string | null;
  details?: string | null;
  created_at?: string | null;
};

type ScamReportRow = {
  bot_key?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type MemberActivityRow = {
  chat_id?: string | null;
  user_id?: string | null;
  activity_date?: string | null;
};

type MemberCountRow = {
  chat_id?: string | null;
  stat_date?: string | null;
  member_count?: number | null;
  member_count_checked_at?: string | null;
};

type PeriodKey = "today" | "month" | "year";

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const PERIODS: PeriodKey[] = ["today", "month", "year"];
const MEMBER_JOIN_ACTIONS = new Set(["member_joined"]);
const MEMBER_LEFT_ACTIONS = new Set(["member_left"]);
const JOIN_REQUEST_ACTIONS = new Set(["member_join_request"]);
const DELETE_ACTIONS = new Set(["delete_message"]);
const DELETE_FAILURE_ACTIONS = new Set(["delete_message_failed"]);
const WARN_ACTIONS = new Set(["warn"]);
const RESTRICT_ACTIONS = new Set(["restrict", "forward_restrict"]);
const BAN_ACTIONS = new Set(["ban"]);
const KICK_ACTIONS = new Set(["kick"]);
const VERIFY_ACTIONS = new Set(["verify_success"]);
const VIOLATION_ACTIONS = new Set([
  ...WARN_ACTIONS,
  ...RESTRICT_ACTIONS,
  ...BAN_ACTIONS,
  ...KICK_ACTIONS,
  ...DELETE_ACTIONS,
]);

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

function vietnamDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function vietnamDateKey(value: string | null | undefined) {
  if (!value) return "";
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  const { year, month, day } = vietnamDateParts(new Date(time));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function vietnamBoundaryUtc(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day) - VIETNAM_OFFSET_MS);
}

function periodBoundaries() {
  const now = new Date();
  const { year, month, day } = vietnamDateParts(now);
  const todayStart = vietnamBoundaryUtc(year, month, day);
  const monthStart = vietnamBoundaryUtc(year, month, 1);
  const yearStart = vietnamBoundaryUtc(year, 1, 1);
  const tomorrowStart = vietnamBoundaryUtc(year, month, day + 1);
  return {
    now,
    today: { start: todayStart, end: tomorrowStart },
    month: { start: monthStart, end: now },
    year: { start: yearStart, end: now },
  };
}

function emptyPeriodStats() {
  return {
    joins: 0,
    leaves: 0,
    netGrowth: 0,
    joinRequests: 0,
    deletedMessages: 0,
    deleteFailures: 0,
    warns: 0,
    restricts: 0,
    bans: 0,
    kicks: 0,
    verifiedMembers: 0,
    violations: 0,
    uniqueViolators: 0,
    scamReports: 0,
    scamPending: 0,
    scamConfirmed: 0,
    scamRejected: 0,
    activeMembers: 0,
    memberCount: 0,
  };
}

function emptySnapshotStats(botKey: string, chatId: string, statDate: string) {
  return {
    bot_key: botKey || "main",
    chat_id: chatId || "",
    stat_date: statDate,
    joins: 0,
    leaves: 0,
    net_growth: 0,
    join_requests: 0,
    deleted_messages: 0,
    delete_failures: 0,
    warns: 0,
    restricts: 0,
    bans: 0,
    kicks: 0,
    verified_members: 0,
    violations: 0,
    unique_violators: 0,
    scam_reports: 0,
    scam_pending: 0,
    scam_confirmed: 0,
    scam_rejected: 0,
    payload: {},
    updated_at: new Date().toISOString(),
  };
}

function isWithin(value: string | null | undefined, start: Date, end: Date) {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= start.getTime() && time < end.getTime();
}

function bumpAudit(stats: ReturnType<typeof emptyPeriodStats>, violators: Set<string>, row: AuditRow) {
  const action = String(row.action || "").toLowerCase();
  if (MEMBER_JOIN_ACTIONS.has(action)) stats.joins += 1;
  if (MEMBER_LEFT_ACTIONS.has(action)) stats.leaves += 1;
  if (JOIN_REQUEST_ACTIONS.has(action)) stats.joinRequests += 1;
  if (DELETE_ACTIONS.has(action)) stats.deletedMessages += 1;
  if (DELETE_FAILURE_ACTIONS.has(action)) stats.deleteFailures += 1;
  if (WARN_ACTIONS.has(action)) stats.warns += 1;
  if (RESTRICT_ACTIONS.has(action)) stats.restricts += 1;
  if (BAN_ACTIONS.has(action)) stats.bans += 1;
  if (KICK_ACTIONS.has(action)) stats.kicks += 1;
  if (VERIFY_ACTIONS.has(action)) stats.verifiedMembers += 1;
  if (VIOLATION_ACTIONS.has(action)) {
    stats.violations += 1;
    const target = String(row.target_user_id || "").trim();
    if (target) violators.add(target);
  }
}

function bumpSnapshotAudit(stats: ReturnType<typeof emptySnapshotStats>, violators: Set<string>, row: AuditRow) {
  const action = String(row.action || "").toLowerCase();
  if (MEMBER_JOIN_ACTIONS.has(action)) stats.joins += 1;
  if (MEMBER_LEFT_ACTIONS.has(action)) stats.leaves += 1;
  if (JOIN_REQUEST_ACTIONS.has(action)) stats.join_requests += 1;
  if (DELETE_ACTIONS.has(action)) stats.deleted_messages += 1;
  if (DELETE_FAILURE_ACTIONS.has(action)) stats.delete_failures += 1;
  if (WARN_ACTIONS.has(action)) stats.warns += 1;
  if (RESTRICT_ACTIONS.has(action)) stats.restricts += 1;
  if (BAN_ACTIONS.has(action)) stats.bans += 1;
  if (KICK_ACTIONS.has(action)) stats.kicks += 1;
  if (VERIFY_ACTIONS.has(action)) stats.verified_members += 1;
  if (VIOLATION_ACTIONS.has(action)) {
    stats.violations += 1;
    const target = String(row.target_user_id || "").trim();
    if (target) violators.add(target);
  }
}

function applySnapshotToPeriod(period: ReturnType<typeof emptyPeriodStats>, row: ReturnType<typeof emptySnapshotStats>) {
  period.joins += row.joins;
  period.leaves += row.leaves;
  period.joinRequests += row.join_requests;
  period.deletedMessages += row.deleted_messages;
  period.deleteFailures += row.delete_failures;
  period.warns += row.warns;
  period.restricts += row.restricts;
  period.bans += row.bans;
  period.kicks += row.kicks;
  period.verifiedMembers += row.verified_members;
  period.violations += row.violations;
  period.uniqueViolators += row.unique_violators;
  period.scamReports += row.scam_reports;
  period.scamPending += row.scam_pending;
  period.scamConfirmed += row.scam_confirmed;
  period.scamRejected += row.scam_rejected;
}

function dateKeyFromBoundary(date: Date) {
  return vietnamDateKey(date.toISOString());
}

function dateKeyWithin(dateKey: string | null | undefined, startKey: string, endKey: string) {
  return Boolean(dateKey && dateKey >= startKey && dateKey < endKey);
}

function applyMemberActivity(periods: Record<PeriodKey, ReturnType<typeof emptyPeriodStats>>, rows: MemberActivityRow[], bounds: ReturnType<typeof periodBoundaries>) {
  const startKeys = {
    today: dateKeyFromBoundary(bounds.today.start),
    month: dateKeyFromBoundary(bounds.month.start),
    year: dateKeyFromBoundary(bounds.year.start),
  };
  const endKeys = {
    today: dateKeyFromBoundary(bounds.today.end),
    month: dateKeyFromBoundary(bounds.now),
    year: dateKeyFromBoundary(bounds.now),
  };
  const activeSets = Object.fromEntries(PERIODS.map((period) => [period, new Set<string>()])) as Record<PeriodKey, Set<string>>;
  for (const row of rows) {
    const userId = String(row.user_id || "").trim();
    const dateKey = String(row.activity_date || "").slice(0, 10);
    if (!userId || !dateKey) continue;
    for (const period of PERIODS) {
      const inclusiveEnd = period === "month" || period === "year" ? "9999-12-31" : endKeys[period];
      if (dateKeyWithin(dateKey, startKeys[period], inclusiveEnd)) {
        activeSets[period].add(userId);
      }
    }
  }
  for (const period of PERIODS) {
    periods[period].activeMembers = activeSets[period].size;
  }
}

function latestMemberCount(rows: MemberCountRow[], groupId?: string) {
  if (groupId) {
    const latest = rows
      .filter((row) => String(row.chat_id || "") === groupId)
      .sort((left, right) => String(right.member_count_checked_at || right.stat_date || "").localeCompare(String(left.member_count_checked_at || left.stat_date || "")))[0];
    return Number(latest?.member_count || 0);
  }
  const latestByChat = new Map<string, MemberCountRow>();
  for (const row of rows) {
    const chatId = String(row.chat_id || "").trim();
    if (!chatId) continue;
    const current = latestByChat.get(chatId);
    const currentKey = String(current?.member_count_checked_at || current?.stat_date || "");
    const nextKey = String(row.member_count_checked_at || row.stat_date || "");
    if (!current || nextKey > currentKey) latestByChat.set(chatId, row);
  }
  return Array.from(latestByChat.values()).reduce((total, row) => total + Number(row.member_count || 0), 0);
}

function buildDailySnapshots(rows: AuditRow[], scams: ScamReportRow[], groupId?: string) {
  const stats = new Map<string, ReturnType<typeof emptySnapshotStats>>();
  const violators = new Map<string, Set<string>>();

  function ensure(botKey: string, chatId: string, statDate: string) {
    const key = `${botKey || "main"}::${chatId || ""}::${statDate}`;
    if (!stats.has(key)) {
      stats.set(key, emptySnapshotStats(botKey || "main", chatId || "", statDate));
      violators.set(key, new Set());
    }
    return { row: stats.get(key)!, violators: violators.get(key)! };
  }

  for (const row of rows) {
    const statDate = vietnamDateKey(row.created_at);
    if (!statDate) continue;
    const botKey = String(row.bot_key || "main");
    const chatId = String(row.chat_id || "");
    const scoped = ensure(botKey, chatId, statDate);
    bumpSnapshotAudit(scoped.row, scoped.violators, row);
    if (!groupId && chatId) {
      const aggregate = ensure(botKey, "", statDate);
      bumpSnapshotAudit(aggregate.row, aggregate.violators, row);
    }
  }

  if (!groupId) {
    for (const row of scams) {
      const statDate = vietnamDateKey(row.created_at);
      if (!statDate) continue;
      const botKey = String(row.bot_key || "main");
      const scoped = ensure(botKey, "", statDate);
      const status = String(row.status || "pending").toLowerCase();
      scoped.row.scam_reports += 1;
      if (status === "confirmed") scoped.row.scam_confirmed += 1;
      else if (status === "rejected") scoped.row.scam_rejected += 1;
      else scoped.row.scam_pending += 1;
    }
  }

  for (const [key, row] of stats) {
    row.net_growth = row.joins - row.leaves;
    row.unique_violators = violators.get(key)?.size || 0;
    row.payload = { source: "audit_logs", rebuilt_at: new Date().toISOString() };
  }

  return Array.from(stats.values());
}

function topActions(rows: AuditRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const action = String(row.action || "unknown").toLowerCase();
    counts.set(action, (counts.get(action) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([action, count]) => ({ action, count }));
}

function topGroups(rows: AuditRow[]) {
  const counts = new Map<string, { chatId: string; joins: number; leaves: number; violations: number }>();
  for (const row of rows) {
    const chatId = String(row.chat_id || "").trim() || "unknown";
    const action = String(row.action || "").toLowerCase();
    const current = counts.get(chatId) || { chatId, joins: 0, leaves: 0, violations: 0 };
    if (MEMBER_JOIN_ACTIONS.has(action)) current.joins += 1;
    if (MEMBER_LEFT_ACTIONS.has(action)) current.leaves += 1;
    if (VIOLATION_ACTIONS.has(action)) current.violations += 1;
    counts.set(chatId, current);
  }
  return Array.from(counts.values())
    .filter((row) => row.joins || row.leaves || row.violations)
    .sort((left, right) => (right.joins + right.leaves + right.violations) - (left.joins + left.leaves + left.violations))
    .slice(0, 8);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const botKey = request.nextUrl.searchParams.get("bot_key")?.trim();
    const groupId = request.nextUrl.searchParams.get("group_id")?.trim();
    const bounds = periodBoundaries();

    let auditQuery = supabaseAdmin
      .from("audit_logs")
      .select("bot_key,action,target_user_id,chat_id,details,created_at")
      .gte("created_at", bounds.year.start.toISOString())
      .order("created_at", { ascending: false })
      .limit(10000);
    if (botKey) auditQuery = auditQuery.eq("bot_key", botKey);
    if (groupId) auditQuery = auditQuery.eq("chat_id", groupId);

    let scamQuery = supabaseAdmin
      .from("scam_reports")
      .select("bot_key,status,created_at")
      .gte("created_at", bounds.year.start.toISOString())
      .order("created_at", { ascending: false })
      .limit(10000);
    if (botKey) scamQuery = scamQuery.eq("bot_key", botKey);

    let groupsQuery = supabaseAdmin
      .from("groups")
      .select("group_id,group_name,enabled,bot_key")
      .limit(1000);
    if (botKey) groupsQuery = groupsQuery.eq("bot_key", botKey);
    if (groupId) groupsQuery = groupsQuery.eq("group_id", groupId);

    const [
      { data: auditRows, error: auditError },
      { data: scamRows, error: scamError },
      { data: groupRows, error: groupError },
    ] = await Promise.all([auditQuery, scamQuery, groupsQuery]);

    if (auditError) throw new Error(auditError.message);
    if (scamError) throw new Error(scamError.message);
    if (groupError) throw new Error(groupError.message);

    const periods = Object.fromEntries(PERIODS.map((period) => [period, emptyPeriodStats()])) as Record<PeriodKey, ReturnType<typeof emptyPeriodStats>>;
    const rows = (auditRows || []) as AuditRow[];
    const scams = (scamRows || []) as ScamReportRow[];
    const snapshots = buildDailySnapshots(rows, scams, groupId || "");
    let snapshotError = "";
    if (snapshots.length) {
      const { error } = await (supabaseAdmin.from("analytics_daily_stats") as any)
        .upsert(snapshots, { onConflict: "bot_key,chat_id,stat_date" });
      snapshotError = error?.message || "";
    }

    const summarySnapshots = snapshots.filter((row) => row.chat_id === (groupId || ""));
    for (const row of summarySnapshots) {
      const statDate = `${row.stat_date}T00:00:00.000Z`;
      for (const period of PERIODS) {
        if (isWithin(statDate, bounds[period].start, bounds[period].end)) {
          applySnapshotToPeriod(periods[period], row);
        }
      }
    }

    for (const period of PERIODS) {
      periods[period].netGrowth = periods[period].joins - periods[period].leaves;
    }

    let memberMetricError = "";
    try {
      let activityQuery = (supabaseAdmin.from("analytics_member_activity") as any)
        .select("chat_id,user_id,activity_date")
        .gte("activity_date", dateKeyFromBoundary(bounds.year.start))
        .limit(20000);
      if (botKey) activityQuery = activityQuery.eq("bot_key", botKey);
      if (groupId) activityQuery = activityQuery.eq("chat_id", groupId);
      const { data: activityRows, error: activityError } = await activityQuery;
      if (activityError) {
        memberMetricError = activityError.message;
      } else {
        applyMemberActivity(periods, (activityRows || []) as MemberActivityRow[], bounds);
      }

      let countQuery = (supabaseAdmin.from("analytics_daily_stats") as any)
        .select("chat_id,stat_date,member_count,member_count_checked_at")
        .gte("stat_date", dateKeyFromBoundary(bounds.year.start))
        .limit(10000);
      if (botKey) countQuery = countQuery.eq("bot_key", botKey);
      if (groupId) countQuery = countQuery.eq("chat_id", groupId);
      const { data: memberCountRows, error: countError } = await countQuery;
      if (countError) {
        memberMetricError = memberMetricError || countError.message;
      } else {
        const count = latestMemberCount((memberCountRows || []) as MemberCountRow[], groupId || "");
        for (const period of PERIODS) {
          periods[period].memberCount = count;
        }
      }
    } catch (exc) {
      memberMetricError = exc instanceof Error ? exc.message : String(exc || "Cannot load member metrics.");
    }

    const todayRows = rows.filter((row) => isWithin(row.created_at, bounds.today.start, bounds.today.end));
    const activeGroups = (groupRows || []).filter((row: any) => row.enabled !== false).length;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      timezone: VIETNAM_TIME_ZONE,
      scope: { botKey: botKey || "", groupId: groupId || "" },
      periods,
      health: {
        activeGroups,
        auditRowsInYear: rows.length,
        dailySnapshots: snapshots.length,
        snapshotError,
        memberMetricError,
        deleteFailureRateToday: periods.today.deletedMessages + periods.today.deleteFailures
          ? periods.today.deleteFailures / (periods.today.deletedMessages + periods.today.deleteFailures)
          : 0,
      },
      topActionsToday: topActions(todayRows),
      topGroupsToday: topGroups(todayRows),
      latestEvents: rows.slice(0, 8),
    });
  } catch (error) {
    return serverError(error);
  }
}
