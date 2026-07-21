import { NextResponse } from "next/server";
import { placeBet } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

const errorMessages: Record<string, [string, number]> = {
  EVENT_CLOSED: ["Приём ставок уже закрыт", 409],
  INVALID_AMOUNT: ["Введите целое количество лир", 400],
  INSUFFICIENT_BALANCE: ["Недостаточно свадебных лир", 409],
  BONUS_UNAVAILABLE: ["Бонус уже использован или истёк", 409],
  FREE_BET_LIMIT: ["Сумма больше номинала бесплатной ставки", 400],
};

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  try {
    const body = (await request.json()) as {
      eventId?: string;
      outcomeId?: string;
      amount?: number;
      idempotencyKey?: string;
      bonusId?: string;
    };
    if (
      !body.eventId ||
      !body.outcomeId ||
      !body.idempotencyKey ||
      !body.amount
    )
      return NextResponse.json(
        { error: "Неполные данные ставки" },
        { status: 400 },
      );
    return NextResponse.json(
      placeBet({
        userId: user.id,
        eventId: body.eventId,
        outcomeId: body.outcomeId,
        amount: body.amount,
        idempotencyKey: body.idempotencyKey,
        bonusId: body.bonusId,
      }),
      { status: 201 },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const [message, status] = errorMessages[code] ?? [
      "Не удалось принять ставку",
      400,
    ];
    return NextResponse.json({ error: message }, { status });
  }
}
