import { NextResponse } from "next/server";
import type { DuelGame } from "@/domain/models";
import { createDuel, getDuelState } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

const errors: Record<string, [string, number]> = {
  INSUFFICIENT_BALANCE: ["Для дуэли нужно 200 свадебных лир", 409],
  OPPONENT_UNAVAILABLE: ["Этого гостя сейчас нельзя вызвать", 409],
  INVALID_DUEL_GAME: ["Неизвестная игра", 400],
  TOO_MANY_OUTGOING_DUELS: ["У вас уже три ожидающих вызова", 409],
  PAIR_DUEL_EXISTS: ["Между вами уже есть ожидающий вызов", 409],
  IDEMPOTENCY_CONFLICT: ["Ключ запроса уже использован", 409],
};

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "USER") return NextResponse.json({ error: "Требуется вход гостя" }, { status: 401 });
  return NextResponse.json(getDuelState(user.id));
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "USER") return NextResponse.json({ error: "Требуется вход гостя" }, { status: 401 });
  try {
    const body = (await request.json()) as { opponentId?: string; game?: DuelGame; idempotencyKey?: string };
    if (!body.opponentId || !body.game || !body.idempotencyKey) return NextResponse.json({ error: "Неполные данные вызова" }, { status: 400 });
    return NextResponse.json(createDuel({ challengerId: user.id, opponentId: body.opponentId, game: body.game, idempotencyKey: body.idempotencyKey }), { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const [message, status] = errors[code] ?? ["Не удалось создать дуэль", 400];
    return NextResponse.json({ error: message }, { status });
  }
}
