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

function dynamicTable(client: ReturnType<typeof getSupabaseAdmin>, table: string) {
  return client.from(table);
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.description || "Telegram sendMessage failed.");
  }
  return response.json();
}

function formatBroadcast(row: Payload) {
  return [
    "Scam confirmed",
    `ID: ${row.id || "-"}`,
    `Risk: ${row.risk_level || "scam"} (${row.scam_percent || 100}%)`,
    `UID: ${row.uid || row.target_uid || "-"}`,
    `Username: ${row.username || row.target_username || "-"}`,
    `Bank: ${row.bank_account || "-"}`,
    `Phone: ${row.phone || "-"}`,
    `Name: ${row.name || row.target_name || "-"}`,
    `Reason: ${row.reason || "-"}`,
  ].join("\n");
}

function buildBroadcastPayload(row: Payload) {
  return {
    title: "Scam confirmed",
    report_id: row.last_report_id || row.id || null,
    entity_id: row.id || null,
    bot_key: row.bot_key || "main",
    target_identity: {
      uid: row.uid || "",
      username: row.username || "",
      bank_account: row.bank_account || "",
      phone: row.phone || "",
      name: row.name || "",
      group_name: row.group_name || "",
      scammer_name: row.scammer_name || "",
    },
    text: formatBroadcast(row),
    scam_percent: row.scam_percent || 100,
    confidence_score: row.confidence_score || 100
  };
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/^@/, "").replace(/[\s._-]+/g, "");
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json().catch(() => ({}))) as Payload;

    const { data: report, error: loadError } = (await dynamicTable(supabaseAdmin, "scam_reports")
      .select("*")
      .eq("id", params.id)
      .single()) as { data: Payload | null; error: { message: string } | null };
    if (loadError || !report) {
      return NextResponse.json({ error: loadError?.message || "Report not found." }, { status: 404 });
    }

    const entityPayload = {
      bot_key: report.bot_key || "main",
      uid: report.target_uid || "",
      username: report.target_username || "",
      bank_account: report.bank_account || "",
      phone: report.phone || "",
      name: report.target_name || "",
      group_name: report.group_name || "",
      group_id: report.group_id || "",
      scammer_name: report.scammer_name || "",
      admin_name: report.admin_name || "",
      normalized_uid: normalize(report.target_uid),
      normalized_username: normalize(report.target_username),
      normalized_bank_account: normalize(report.bank_account),
      normalized_phone: normalize(report.phone),
      normalized_name: normalize(report.target_name),
      risk_level: String(body.risk_level || "scam"),
      scam_percent: Number(body.scam_percent || report.scam_percent || 100),
      confidence_score: Number(body.confidence_score || report.confidence_score || 100),
      reason: String(body.reason || report.reason || "Xác nhận từ báo cáo thành viên"),
      notes: String(body.notes || report.notes || ""),
      evidence_payload: report.evidence_payload || {},
      source: String(body.source || "scam_report"),
      status: "confirmed",
      enabled: true,
      last_report_id: Number(params.id),
      reviewed_by: String(body.reviewed_by || report.reviewed_by || ""),
      reviewed_at: String(body.reviewed_at || new Date().toISOString()),
      updated_by: String(body.updated_by || ""),
      updated_at: new Date().toISOString()
    };

    const { data: entity, error: entityError } = (await (dynamicTable(supabaseAdmin, "scam_entities") as any)
      .insert(entityPayload)
      .select("*")
      .single()) as { data: Payload | null; error: { message: string } | null };
    if (entityError) {
      return serverError(new Error(entityError.message));
    }

    const { data: updatedReport, error: updateError } = (await (dynamicTable(supabaseAdmin, "scam_reports") as any)
      .update({
        status: "confirmed",
        reviewed_by: entityPayload.reviewed_by,
        reviewed_at: entityPayload.reviewed_at,
        scam_percent: entityPayload.scam_percent,
        confidence_score: entityPayload.confidence_score
      })
      .eq("id", params.id)
      .select("*")
      .single()) as { data: Payload | null; error: { message: string } | null };
    if (updateError) {
      return serverError(new Error(updateError.message));
    }

    try {
      const { data: configRows } = await supabaseAdmin
        .from("config")
        .select("key,value")
        .eq("enabled", true)
        .in("key", ["scam_broadcast_chat_id", "scam_review_channel_id", "scam_broadcast_enabled"]);
      const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
      const configList = (configRows || []) as Array<{ key?: string; value?: string }>;
      const isEnabled = configList.find((row) => row.key === "scam_broadcast_enabled")?.value !== "false";
      const targetChatId = configList.find((row) => row.key === "scam_broadcast_chat_id")?.value
        || configList.find((row) => row.key === "scam_review_channel_id")?.value
        || "";
      const broadcastPayload = buildBroadcastPayload(entity || updatedReport || report);
      if (token && targetChatId && isEnabled) {
        await sendTelegramMessage(token, String(targetChatId), formatBroadcast(entity || updatedReport || report));
        await (supabaseAdmin.from("scam_broadcasts") as any).insert({
          bot_key: broadcastPayload.bot_key,
          entity_id: broadcastPayload.entity_id,
          report_id: broadcastPayload.report_id,
          target_chat_id: String(targetChatId),
          broadcast_type: "new_entity",
          payload: broadcastPayload,
          status: "sent",
          sent_at: new Date().toISOString()
        });
      }
    } catch {
      // Broadcast should never block confirmation.
    }

    return NextResponse.json({ report: updatedReport, entity });
  } catch (error) {
    return serverError(error);
  }
}
