import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;

type DynamicTable = {
  select: (columns?: string) => DynamicTable;
  order: (column: string, options?: { ascending?: boolean }) => DynamicTable;
  or: (filters: string) => DynamicTable;
  eq: (column: string, value: unknown) => DynamicTable;
  ilike: (column: string, value: string) => DynamicTable;
  insert: (payload: Payload | Payload[]) => DynamicTable;
  update: (payload: Payload) => DynamicTable;
  delete: () => DynamicTable;
  single: () => DynamicTable;
  then: Promise<unknown>["then"];
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

function dynamicTable(client: ReturnType<typeof getSupabaseAdmin>, table: string) {
  return client.from(table) as unknown as DynamicTable;
}

function parseMaybeJson(value: unknown) {
  if (value === undefined || value === null || value === "") return {};
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return {};
}

function normalizedText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[\s._-]+/g, "");
}

function computeScamScore(payload: Payload) {
  let score = 0;
  if (payload.target_uid) score += 20;
  if (payload.target_username) score += 15;
  if (payload.bank_account) score += 20;
  if (payload.phone) score += 15;
  if (payload.target_name) score += 10;
  if (payload.scammer_name) score += 10;
  if ((payload.attachment_count as number) || 0) score += Math.min(10, Number(payload.attachment_count || 0) * 2);
  return Math.max(0, Math.min(100, score));
}

function buildScamUpdate(payload: Payload) {
  const next: Payload = { ...payload };
  next.evidence_payload = parseMaybeJson(next.evidence_payload);
  next.attachment_count = Number(next.attachment_count || 0);
  next.confidence_score = Number(next.confidence_score || 0);
  next.scam_percent = Number(next.scam_percent || computeScamScore(next));
  if (!next.scam_percent) {
    next.scam_percent = computeScamScore(next);
  }
  return next;
}

function buildSearchFilter(q: string) {
  const parts = [q];
  const digits = q.replace(/\D+/g, "");
  if (digits && digits !== q) parts.push(digits);
  if (q.startsWith("@")) parts.push(q.slice(1));
  return parts
    .map((item) => normalizedText(item))
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const botKey = request.nextUrl.searchParams.get("bot_key")?.trim();
    const status = request.nextUrl.searchParams.get("status")?.trim();
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 200), 500);

    let query = dynamicTable(supabaseAdmin, "scam_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (botKey) {
      query = query.eq("bot_key", botKey);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (search) {
      const filters = buildSearchFilter(search)
        .flatMap((item) => [
          `target_uid.ilike.%${item}%`,
          `target_username.ilike.%${item}%`,
          `target_name.ilike.%${item}%`,
          `bank_account.ilike.%${item}%`,
          `phone.ilike.%${item}%`,
          `group_name.ilike.%${item}%`,
          `scammer_name.ilike.%${item}%`,
          `admin_name.ilike.%${item}%`,
          `evidence_text.ilike.%${item}%`
        ])
        .join(",");
      if (filters) {
        query = query.or(filters);
      }
    }

    const { data, error } = (await query) as { data: Payload[] | null; error: { message: string } | null };
    if (error) {
      return serverError(new Error(error.message));
    }
    return NextResponse.json({ rows: (data || []).slice(0, limit) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json()) as Payload;
    const payload = buildScamUpdate({
      ...body,
      reporter_user_id: String(body.reporter_user_id || ""),
      reporter_username: String(body.reporter_username || ""),
      reporter_chat_id: String(body.reporter_chat_id || ""),
      source_chat_id: String(body.source_chat_id || ""),
      source_message_id: String(body.source_message_id || ""),
      target_uid: String(body.target_uid || ""),
      target_username: String(body.target_username || ""),
      target_name: String(body.target_name || ""),
      bank_account: String(body.bank_account || ""),
      phone: String(body.phone || ""),
      group_name: String(body.group_name || ""),
      group_id: String(body.group_id || ""),
      scammer_name: String(body.scammer_name || ""),
      admin_name: String(body.admin_name || ""),
      reason: String(body.reason || ""),
      notes: String(body.notes || ""),
      evidence_text: String(body.evidence_text || ""),
      status: String(body.status || "pending"),
      evidence_payload: parseMaybeJson(body.evidence_payload),
    });

    const { data, error } = (await (dynamicTable(supabaseAdmin, "scam_reports") as any)
      .insert(payload)
      .select("*")
      .single()) as { data: Payload | null; error: { message: string } | null };
    if (error) {
      return serverError(new Error(error.message));
    }
    return NextResponse.json({ row: data });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json()) as { id?: string | number; values?: Payload };
    if (!body.id) {
      return badRequest("Missing report id.");
    }
    const values = buildScamUpdate(body.values || {});
    if (values.status === "confirmed" && !values.reviewed_at) {
      values.reviewed_at = new Date().toISOString();
    }
    const { data, error } = (await (dynamicTable(supabaseAdmin, "scam_reports") as any)
      .update(values)
      .eq("id", body.id)
      .select("*")
      .single()) as { data: Payload | null; error: { message: string } | null };
    if (error) {
      return serverError(new Error(error.message));
    }
    return NextResponse.json({ row: data });
  } catch (error) {
    return serverError(error);
  }
}
