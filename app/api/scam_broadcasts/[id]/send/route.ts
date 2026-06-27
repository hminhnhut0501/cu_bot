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

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.description || "Telegram sendMessage failed.");
  }
  return response.json();
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));
    const { data: broadcast, error } = (await supabaseAdmin
      .from("scam_broadcasts")
      .select("*")
      .eq("id", params.id)
      .single()) as { data: { target_chat_id?: string; payload?: Record<string, unknown> } | null; error: { message: string } | null };
    if (error || !broadcast) {
      return NextResponse.json({ error: error?.message || "Broadcast not found." }, { status: 404 });
    }
    const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
    const chatId = String((body as { target_chat_id?: string }).target_chat_id || broadcast.target_chat_id || "");
    const text = String((body as { text?: string }).text || broadcast.payload?.text || "Scam broadcast");
    if (!token || !chatId) {
      return NextResponse.json({ error: "Missing token or target chat." }, { status: 400 });
    }
    await sendTelegramMessage(token, chatId, text);
    const { data: updated } = await (supabaseAdmin.from("scam_broadcasts") as any)
      .update({ status: "sent", sent_at: new Date().toISOString(), target_chat_id: chatId, payload: { ...(broadcast.payload || {}), text } })
      .eq("id", params.id)
      .select("*")
      .single();
    return NextResponse.json({ row: updated || broadcast });
  } catch (error) {
    return serverError(error);
  }
}
