import { NextResponse } from "next/server";
import {
  createDevelopmentSession,
  exchangeLoginToken,
} from "@/infrastructure/mock/store";
import { SESSION_COOKIE } from "@/lib/auth";
import { requestUsesHttps } from "@/lib/request-url";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token)
      return NextResponse.json(
        { error: "Укажите токен входа" },
        { status: 400 },
      );
    const isDevelopmentDemo =
      (process.env.NODE_ENV !== "production" || process.env.E2E_TEST === "1") &&
      ["guest-demo", "misha-demo", "admin-demo"].includes(body.token);
    const { session, user } = isDevelopmentDemo
      ? createDevelopmentSession(body.token)
      : exchangeLoginToken(body.token);
    const response = NextResponse.json({
      user: { id: user.id, displayName: user.displayName, role: user.role },
    });
    response.cookies.set(SESSION_COOKIE, session.id, {
      httpOnly: true,
      sameSite: "lax",
      // A production build is often tested from a phone over http://<LAN-IP>.
      // Secure cookies must follow the actual public protocol or mobile browsers discard them.
      secure: requestUsesHttps(request),
      path: "/",
      expires: new Date(session.expiresAt),
    });
    return response;
  } catch (error) {
    const message =
      error instanceof Error && error.message === "ACCOUNT_BLOCKED"
        ? "Аккаунт заблокирован"
        : "Ссылка недействительна или уже использована";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
