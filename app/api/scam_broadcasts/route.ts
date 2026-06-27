import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : "Server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from("scam_broadcasts").select("*").order("created_at", { ascending: false });
    if (error) return serverError(new Error(error.message));
    return NextResponse.json({ rows: data || [] });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { data, error } = await (supabaseAdmin.from("scam_broadcasts") as any)
      .insert({
        bot_key: String(body.bot_key || "main"),
        entity_id: body.entity_id || null,
        report_id: body.report_id || null,
        target_chat_id: String(body.target_chat_id || ""),
        broadcast_type: String(body.broadcast_type || "manual"),
        payload: body.payload || {},
        status: String(body.status || "pending"),
      })
      .select("*")
      .single();
    if (error) return serverError(new Error(error.message));
    return NextResponse.json({ row: data });
  } catch (error) {
    return serverError(error);
  }
}
