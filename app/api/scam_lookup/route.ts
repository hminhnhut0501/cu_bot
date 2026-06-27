import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server error.";
  return NextResponse.json({ error: message }, { status: 500 });
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
    const q = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (!q) {
      return NextResponse.json({ query: q, matches: [] });
    }
    const supabaseAdmin = getSupabaseAdmin();
    const n = normalize(q);
    const queryParts = [
      `uid.ilike.%${q}%`,
      `username.ilike.%${q}%`,
      `bank_account.ilike.%${q}%`,
      `phone.ilike.%${q}%`,
      `name.ilike.%${q}%`,
      `group_name.ilike.%${q}%`,
      `scammer_name.ilike.%${q}%`,
      `admin_name.ilike.%${q}%`,
      `normalized_uid.ilike.%${n}%`,
      `normalized_username.ilike.%${n}%`,
      `normalized_bank_account.ilike.%${n}%`,
      `normalized_phone.ilike.%${n}%`,
      `normalized_name.ilike.%${n}%`
    ].join(",");

    const [entitiesPayload, reportsPayload, aliasesPayload] = await Promise.all([
      supabaseAdmin.from("scam_entities").select("*").or(queryParts).order("created_at", { ascending: false }),
      supabaseAdmin.from("scam_reports").select("*").or([
        `target_uid.ilike.%${q}%`,
        `target_username.ilike.%${q}%`,
        `target_name.ilike.%${q}%`,
        `bank_account.ilike.%${q}%`,
        `phone.ilike.%${q}%`,
        `group_name.ilike.%${q}%`,
        `scammer_name.ilike.%${q}%`,
        `admin_name.ilike.%${q}%`,
        `evidence_text.ilike.%${q}%`
      ].join(",")).order("created_at", { ascending: false }),
      supabaseAdmin.from("scam_aliases").select("*").or(`alias_value.ilike.%${q}%,normalized_value.ilike.%${n}%`).order("created_at", { ascending: false })
    ]);

    const entities = ((entitiesPayload as { data: Payload[] | null; error: { message: string } | null }).data || []).map((row) => ({
      ...row,
      matched_on: row.normalized_uid && normalize(row.normalized_uid) === n ? "normalized_uid" : row.uid ? "uid" : "field",
      result_type: "entity"
    }));
    const reports = ((reportsPayload as { data: Payload[] | null; error: { message: string } | null }).data || []).map((row) => ({
      ...row,
      matched_on: row.target_uid && normalize(row.target_uid) === n ? "target_uid" : row.bank_account ? "bank_account" : "field",
      result_type: "report"
    }));
    const aliases = ((aliasesPayload as { data: Payload[] | null; error: { message: string } | null }).data || []).map((row) => ({
      ...row,
      result_type: "alias"
    }));

    const matches = [...entities, ...reports, ...aliases].slice(0, 50);
    return NextResponse.json({ query: q, matches });
  } catch (error) {
    return serverError(error);
  }
}
