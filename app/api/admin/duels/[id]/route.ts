import { NextResponse } from "next/server";
import { cancelDuel } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try {
    const { id } = await params;
    const body = (await request.json()) as { action?: "cancel"; idempotencyKey?: string };
    if (body.action !== "cancel" || !body.idempotencyKey) return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
    return NextResponse.json({ duel: cancelDuel({ duelId: id, actorId: admin.id, idempotencyKey: body.idempotencyKey, admin: true }) });
  } catch (error) {
    const message = error instanceof Error && error.message === "DUEL_NOT_PENDING" ? "Можно отменить только ожидающую дуэль" : "Не удалось отменить дуэль";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
