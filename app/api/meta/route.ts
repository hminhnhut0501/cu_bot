import { NextResponse } from "next/server";

import { TABLES } from "@/lib/tables";

export function GET() {
  return NextResponse.json({
    tables: TABLES,
    passwordRequired: Boolean(process.env.CP_ADMIN_PASSWORD)
  });
}
