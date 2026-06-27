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
  single: () => DynamicTable;
  then: Promise<unknown>["then"];
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

function dynamicTable(client: ReturnType<typeof getSupabaseAdmin>, table: string) {
  return client.from(table) as unknown as DynamicTable;
}

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[\s._-]+/g, "");
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

    let query = dynamicTable(supabaseAdmin, "scam_entities")
      .select("*")
      .order("created_at", { ascending: false });

    if (botKey) {
      query = query.eq("bot_key", botKey);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (search) {
      const n = normalize(search);
      const filter = [
        `uid.ilike.%${search}%`,
        `username.ilike.%${search}%`,
        `bank_account.ilike.%${search}%`,
        `phone.ilike.%${search}%`,
        `name.ilike.%${search}%`,
        `group_name.ilike.%${search}%`,
        `scammer_name.ilike.%${search}%`,
        `admin_name.ilike.%${search}%`,
        `normalized_uid.ilike.%${n}%`,
        `normalized_username.ilike.%${n}%`,
        `normalized_bank_account.ilike.%${n}%`,
        `normalized_phone.ilike.%${n}%`,
        `normalized_name.ilike.%${n}%`
      ].join(",");
      query = query.or(filter);
    }

    const { data, error } = (await query) as { data: Payload[] | null; error: { message: string } | null };
    if (error) {
      return serverError(new Error(error.message));
    }
    return NextResponse.json({ rows: data || [] });
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
    const payload = {
      ...body,
      uid: String(body.uid || ""),
      username: String(body.username || ""),
      bank_account: String(body.bank_account || ""),
      phone: String(body.phone || ""),
      name: String(body.name || ""),
      group_name: String(body.group_name || ""),
      group_id: String(body.group_id || ""),
      scammer_name: String(body.scammer_name || ""),
      admin_name: String(body.admin_name || ""),
      normalized_uid: normalize(body.uid),
      normalized_username: normalize(body.username),
      normalized_bank_account: normalize(body.bank_account),
      normalized_phone: normalize(body.phone),
      normalized_name: normalize(body.name),
      risk_level: String(body.risk_level || "scam"),
      scam_percent: Number(body.scam_percent || 100),
      confidence_score: Number(body.confidence_score || 100),
      reason: String(body.reason || ""),
      notes: String(body.notes || ""),
      evidence_payload: typeof body.evidence_payload === "object" && body.evidence_payload ? body.evidence_payload : {},
      source: String(body.source || "manual"),
      status: String(body.status || "confirmed"),
      enabled: body.enabled === undefined ? true : Boolean(body.enabled),
      reviewed_by: String(body.reviewed_by || ""),
      reviewed_at: String(body.reviewed_at || ""),
      updated_by: String(body.updated_by || ""),
      updated_at: String(body.updated_at || new Date().toISOString())
    };
    const { data, error } = (await (dynamicTable(supabaseAdmin, "scam_entities") as any)
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
      return NextResponse.json({ error: "Missing entity id." }, { status: 400 });
    }
    const values = { ...(body.values || {}) } as Payload;
    if (values.uid !== undefined) values.normalized_uid = normalize(values.uid);
    if (values.username !== undefined) values.normalized_username = normalize(values.username);
    if (values.bank_account !== undefined) values.normalized_bank_account = normalize(values.bank_account);
    if (values.phone !== undefined) values.normalized_phone = normalize(values.phone);
    if (values.name !== undefined) values.normalized_name = normalize(values.name);
    values.updated_at = new Date().toISOString();
    const { data, error } = (await (dynamicTable(supabaseAdmin, "scam_entities") as any)
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
