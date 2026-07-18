import { NextResponse } from "next/server";
import { cancelEvent, resolveEvent } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try {
    const { id } = await params;
    const body = (await request.json()) as { action?: "resolve" | "cancel"; winningOutcomeId?: string };
    if (body.action === "cancel") return NextResponse.json(cancelEvent(id));
    if (body.action === "resolve" && body.winningOutcomeId) return NextResponse.json(resolveEvent(id, body.winningOutcomeId));
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка" }, { status: 409 });
  }
}
