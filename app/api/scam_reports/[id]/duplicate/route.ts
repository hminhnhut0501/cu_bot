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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json().catch(() => ({}))) as Payload;
    const { data, error } = (await (supabaseAdmin
      .from("scam_reports") as any)
      .update({
        status: "duplicate",
        duplicate_of: body.duplicate_of || null,
        admin_note: String(body.admin_note || ""),
        reviewed_by: String(body.reviewed_by || ""),
        reviewed_at: new Date().toISOString()
      })
      .eq("id", params.id)
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
