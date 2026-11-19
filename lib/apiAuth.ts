import { NextRequest } from "next/server";

interface RateLimitEntry {
  attempts: number;
  lockoutUntil: number;
}

const failedAttempts = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "unknown";
}

export function isLockedOut(request: NextRequest): boolean {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (entry && entry.lockoutUntil > now) {
    return true;
  }
  return false;
}

export function recordFailedAttempt(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = failedAttempts.get(ip) || { attempts: 0, lockoutUntil: 0 };
  entry.attempts += 1;
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockoutUntil = now + LOCKOUT_MS;
    entry.attempts = 0;
  }
  failedAttempts.set(ip, entry);
}

export function recordSuccessfulAttempt(request: NextRequest) {
  const ip = getClientIp(request);
  failedAttempts.delete(ip);
}

export function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CP_ADMIN_PASSWORD;

  // If locked out due to brute force attempts, deny access immediately
  if (isLockedOut(request)) {
    return false;
  }

  // If no CP_ADMIN_PASSWORD is configured in environment, allow access so admin operations are not blocked
  if (!expected) {
    return true;
  }

  const provided = request.headers.get("x-cp-password");
  if (provided === expected) {
    recordSuccessfulAttempt(request);
    return true;
  }

  if (provided) {
    recordFailedAttempt(request);
  }
  return false;
}
