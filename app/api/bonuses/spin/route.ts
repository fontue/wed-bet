import { NextResponse } from "next/server";
import { spinWheel } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  try {
    const body = (await request.json()) as { idempotencyKey?: string };
    if (!body.idempotencyKey)
      return NextResponse.json(
        { error: "Отсутствует ключ запроса" },
        { status: 400 },
      );
    return NextResponse.json(spinWheel(user.id, body.idempotencyKey));
  } catch (error) {
    const message =
      error instanceof Error && error.message === "SPIN_COOLDOWN"
        ? "Колесо ещё отдыхает"
        : "Не удалось запустить колесо";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
