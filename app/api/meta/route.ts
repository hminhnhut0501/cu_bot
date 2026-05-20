import { NextResponse } from "next/server";

import { TABLES } from "@/lib/tables";

export function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const botToken = process.env.BOT_TOKEN;
  const botKey = process.env.BOT_KEY;

  return NextResponse.json({
    tables: TABLES,
    passwordRequired: Boolean(process.env.CP_ADMIN_PASSWORD),
    envStatus: {
      supabaseUrl: Boolean(supabaseUrl),
      serviceRoleKey: Boolean(serviceRoleKey),
      cpPassword: Boolean(process.env.CP_ADMIN_PASSWORD),
      botToken: Boolean(botToken),
      botKey: Boolean(botKey),
      runtimeMode: process.env.WEBHOOK_URL ? "webhook" : "polling_or_render"
    }
  });
}
