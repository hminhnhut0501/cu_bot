import { NextRequest, NextResponse } from "next/server";

import { isAuthorized } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const filePath = request.nextUrl.searchParams.get("file_path")?.trim();
  const fileId = request.nextUrl.searchParams.get("file_id")?.trim();
  const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
  if (!token || (!filePath && !fileId)) {
    return NextResponse.json({ error: "Missing file path." }, { status: 400 });
  }

  let resolvedPath = filePath || "";
  if (!resolvedPath && fileId) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        return NextResponse.json({ error: "Cannot resolve Telegram file." }, { status: 502 });
      }
      const payload = await response.json();
      resolvedPath = payload?.result?.file_path || "";
    } catch {
      return NextResponse.json({ error: "Cannot resolve Telegram file." }, { status: 502 });
    }
  }

  if (!resolvedPath) {
    return NextResponse.json({ error: "File path unavailable." }, { status: 404 });
  }

  return NextResponse.redirect(`https://api.telegram.org/file/bot${token}/${resolvedPath}`);
}
