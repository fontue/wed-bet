import { NextResponse } from "next/server";
import { revokeSession } from "@/infrastructure/mock/store";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const sessionId = request.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  if (sessionId) revokeSession(sessionId);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
