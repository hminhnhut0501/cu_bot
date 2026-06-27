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
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json().catch(() => ({}))) as Payload;
    const { data: report, error: loadError } = (await supabaseAdmin
      .from("scam_reports")
      .select("*")
      .eq("id", params.id)
      .single()) as { data: Payload | null; error: { message: string } | null };
    if (loadError || !report) {
      return NextResponse.json({ error: loadError?.message || "Report not found." }, { status: 404 });
    }
    const { data, error } = (await (supabaseAdmin
      .from("scam_reports") as any)
      .update({
        status: "need_more_info",
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
    const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
    const reporterChatId = String(report.reporter_chat_id || report.source_chat_id || "");
    if (token && reporterChatId) {
      try {
        const note = String(body.admin_note || report.admin_note || "Vui lòng bổ sung thêm bằng chứng / thông tin.");
        await sendTelegramMessage(
          token,
          reporterChatId,
          `Báo cáo #${report.id} cần bổ sung:\n${note}`
        );
      } catch {
        // follow-up should not block review state
      }
    }
    return NextResponse.json({ row: data });
  } catch (error) {
    return serverError(error);
  }
}
