import type { AnySlotRound } from "@/domain/models";

export type SlotGameId = AnySlotRound["gameId"];
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface StoredRoundPresentation {
  version: 1;
  gameId: SlotGameId;
  userId: string;
  roundId: string;
  savedAt: number;
  phase: "confirmed";
  round: AnySlotRound;
}

export const ROUND_PRESENTATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const roundPresentationKey = (gameId: SlotGameId, userId: string) =>
  `wedbet:slot-presentation:v1:${gameId}:${userId}`;

export function saveRoundPresentation(
  storage: StorageLike,
  round: AnySlotRound,
  now = Date.now(),
) {
  const snapshot: StoredRoundPresentation = {
    version: 1,
    gameId: round.gameId,
    userId: round.userId,
    roundId: round.id,
    savedAt: now,
    phase: "confirmed",
    round,
  };
  try {
    storage.setItem(
      roundPresentationKey(round.gameId, round.userId),
      JSON.stringify(snapshot),
    );
  } catch {
    /* Presentation recovery is best-effort; settlement already happened on the server. */
  }
}

export function clearRoundPresentation(
  storage: StorageLike,
  gameId: SlotGameId,
  userId: string,
) {
  try {
    storage.removeItem(roundPresentationKey(gameId, userId));
  } catch {
    /* Ignore unavailable/private storage. */
  }
}

export function loadRoundPresentation<T extends AnySlotRound>(
  storage: StorageLike,
  input: {
    gameId: T["gameId"];
    userId: string;
    availableRoundIds: ReadonlySet<string>;
    now?: number;
    maxAgeMs?: number;
  },
): T | undefined {
  const key = roundPresentationKey(input.gameId, input.userId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return;
    const value = JSON.parse(raw) as Partial<StoredRoundPresentation>,
      round = value.round as Partial<AnySlotRound> | undefined;
    const valid =
      value.version === 1 &&
      value.gameId === input.gameId &&
      value.userId === input.userId &&
      value.phase === "confirmed" &&
      typeof value.savedAt === "number" &&
      (input.now ?? Date.now()) - value.savedAt <=
        (input.maxAgeMs ?? ROUND_PRESENTATION_MAX_AGE_MS) &&
      typeof value.roundId === "string" &&
      input.availableRoundIds.has(value.roundId) &&
      round?.id === value.roundId &&
      round.gameId === input.gameId &&
      round.userId === input.userId &&
      typeof round.createdAt === "string" &&
      typeof round.totalWin === "number" &&
      typeof round.result === "object";
    if (!valid) {
      storage.removeItem(key);
      return;
    }
    return value.round as T;
  } catch {
    try {
      storage.removeItem(key);
    } catch {}
    return;
  }
}
