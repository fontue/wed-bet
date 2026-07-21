import { NextResponse } from "next/server";
import {
  acceptDuel,
  cancelDuel,
  createDuel,
  declineDuel,
  getDuelById,
} from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

const errors: Record<string, [string, number]> = {
  INSUFFICIENT_BALANCE: ["Для принятия дуэли нужно 200 свадебных лир", 409],
  DUEL_NOT_FOUND: ["Дуэль не найдена", 404],
  DUEL_NOT_PENDING: ["Этот вызов уже завершён", 409],
  PAIR_DUEL_EXISTS: ["Между вами уже есть ожидающий вызов", 409],
  TOO_MANY_OUTGOING_DUELS: ["У вас уже три ожидающих вызова", 409],
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || user.role !== "USER")
    return NextResponse.json(
      { error: "Требуется вход гостя" },
      { status: 401 },
    );
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      action?: "accept" | "decline" | "cancel" | "rematch";
      idempotencyKey?: string;
    };
    if (!body.action || !body.idempotencyKey)
      return NextResponse.json(
        { error: "Неполные данные команды" },
        { status: 400 },
      );
    if (body.action === "accept")
      return NextResponse.json(
        acceptDuel({
          duelId: id,
          opponentId: user.id,
          idempotencyKey: body.idempotencyKey,
        }),
      );
    if (body.action === "decline")
      return NextResponse.json({
        duel: declineDuel({
          duelId: id,
          opponentId: user.id,
          idempotencyKey: body.idempotencyKey,
        }),
      });
    if (body.action === "cancel")
      return NextResponse.json({
        duel: cancelDuel({
          duelId: id,
          actorId: user.id,
          idempotencyKey: body.idempotencyKey,
        }),
      });
    if (body.action === "rematch") {
      const previous = getDuelById(id);
      if (
        !previous ||
        previous.status !== "RESOLVED" ||
        ![previous.challengerId, previous.opponentId].includes(user.id)
      )
        throw new Error("DUEL_NOT_FOUND");
      const opponentId =
        previous.challengerId === user.id
          ? previous.opponentId
          : previous.challengerId;
      return NextResponse.json(
        createDuel({
          challengerId: user.id,
          opponentId,
          game: previous.game,
          idempotencyKey: body.idempotencyKey,
        }),
        { status: 201 },
      );
    }
    return NextResponse.json({ error: "Неизвестная команда" }, { status: 400 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const [message, status] = errors[code] ?? [
      "Не удалось выполнить действие",
      400,
    ];
    return NextResponse.json({ error: message }, { status });
  }
}
