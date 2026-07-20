import { NextResponse } from "next/server";
import { spinSweetLemonza } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

const errors: Record<string, [string, number]> = {
  SLOT_DISABLED: ["Игра временно закрыта крупье", 409],
  INVALID_STAKE: ["Эта ставка сейчас недоступна", 400],
  INSUFFICIENT_BALANCE: ["Недостаточно свадебных лир", 409],
  SPIN_IN_PROGRESS: ["Предыдущий Spin ещё обрабатывается", 409],
  IDEMPOTENCY_CONFLICT: ["Ключ запроса уже использован", 409],
  INVALID_MODE: ["Неизвестный режим игры", 400],
  MODE_DISABLED: ["Этот режим отключён крупье", 409],
};

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "USER") return NextResponse.json({ error: "Требуется вход гостя" }, { status: 401 });
  try {
    const body = (await request.json()) as { gameId?: string; stake?: number; mode?: "STANDARD" | "LEMON_BOOST" | "BONUS_BUY"; idempotencyKey?: string };
    if (body.gameId !== "sweet-lemonza" || !body.stake || !body.idempotencyKey) return NextResponse.json({ error: "Неполные данные Spin" }, { status: 400 });
    return NextResponse.json(spinSweetLemonza({ userId: user.id, stake: body.stake, mode: body.mode ?? "STANDARD", idempotencyKey: body.idempotencyKey }), { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const [message, status] = errors[code] ?? ["Не удалось выполнить Spin", 400];
    return NextResponse.json({ error: message }, { status });
  }
}
