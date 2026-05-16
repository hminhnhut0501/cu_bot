import { NextRequest } from "next/server";

export function isAuthorized(request: NextRequest) {
  const expected = process.env.CP_ADMIN_PASSWORD;
  if (!expected) {
    return true;
  }
  return request.headers.get("x-cp-password") === expected;
}
