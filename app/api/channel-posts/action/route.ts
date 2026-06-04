import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type ActionBody = {
  id?: number;
  action?: string;
  scheduled_at?: string | null;
  delete_at?: string | null;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const body = (await request.json()) as ActionBody;
  const id = Number(body.id);
  const action = String(body.action || "");
  if (!id || !action) {
    return badRequest("Thiếu bài đăng hoặc hành động.");
  }

  const now = new Date().toISOString();
  let values: Record<string, unknown>;
  let eventType = action;
  let message = "";

  if (action === "send_now" || action === "retry") {
    values = { status: "queued", scheduled_at: null, error: "", error_code: "", updated_at: now };
    eventType = action === "retry" ? "send_retry_queued" : "send_queued";
    message = action === "retry" ? "Admin yêu cầu thử gửi lại." : "Admin yêu cầu gửi ngay.";
  } else if (action === "schedule") {
    if (!body.scheduled_at || Date.parse(body.scheduled_at) <= Date.now()) {
      return badRequest("Giờ gửi phải nằm trong tương lai.");
    }
    values = { status: "scheduled", scheduled_at: body.scheduled_at, error: "", error_code: "", updated_at: now };
    eventType = "send_scheduled";
    message = "Admin đã hẹn giờ gửi bài.";
  } else if (action === "cancel_schedule") {
    values = { status: "draft", scheduled_at: null, error: "", error_code: "", updated_at: now };
    eventType = "send_schedule_cancelled";
    message = "Admin đã hủy lịch gửi.";
  } else if (action === "delete_now") {
    values = { status: "delete_scheduled", delete_at: now, deleted_by: "admin_cp", error: "", error_code: "", updated_at: now };
    eventType = "delete_queued";
    message = "Admin yêu cầu xóa bài ngay.";
  } else if (action === "retry_delete") {
    values = { status: "delete_scheduled", delete_at: now, error: "", error_code: "", updated_at: now };
    eventType = "delete_retry_queued";
    message = "Admin yêu cầu thử xóa lại.";
  } else if (action === "schedule_delete") {
    if (!body.delete_at || Date.parse(body.delete_at) <= Date.now()) {
      return badRequest("Giờ xóa phải nằm trong tương lai.");
    }
    values = { status: "delete_scheduled", delete_at: body.delete_at, error: "", error_code: "", updated_at: now };
    eventType = "delete_scheduled";
    message = "Admin đã hẹn giờ xóa bài.";
  } else if (action === "cancel_delete") {
    values = { status: "sent", delete_at: null, error: "", error_code: "", updated_at: now };
    eventType = "delete_schedule_cancelled";
    message = "Admin đã hủy lịch xóa.";
  } else {
    return badRequest("Hành động không được hỗ trợ.");
  }

  const supabase = getSupabaseAdmin();
  const db = supabase as any;
  const { data, error } = await db.from("channel_posts").update(values).eq("id", id).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("channel_post_events").insert({
    bot_key: data.bot_key || "main",
    channel_post_id: id,
    event_type: eventType,
    message,
    details: { scheduled_at: body.scheduled_at || null, delete_at: body.delete_at || null }
  });

  return NextResponse.json({ row: data });
}
