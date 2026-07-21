import assert from "node:assert/strict";
import type { SlotRound } from "../domain/models.ts";
import {
  clearRoundPresentation,
  loadRoundPresentation,
  roundPresentationKey,
  saveRoundPresentation,
} from "../components/slots/shared/round-presentation-snapshot.ts";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}
function test(name: string, run: () => void) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}
const round = {
  id: "round-recovery",
  gameId: "sweet-lemonza",
  mathVersion: "test",
  userId: "u-sofia",
  stake: 20,
  mode: "STANDARD",
  chargedAmount: 20,
  baseWin: 0,
  scatterWin: 0,
  bonusWin: 200,
  totalWin: 200,
  balanceBefore: 1000,
  balanceAfter: 1180,
  bonusTriggered: true,
  maxMultiplier: 2,
  idempotencyKey: "recovery-key",
  createdAt: new Date(1_000).toISOString(),
  result: {
    mathVersion: "test",
    mode: "STANDARD",
    stake: 20,
    chargedAmount: 20,
    base: null,
    freeSpins: [],
    baseGamePayout: 0,
    scatterPayout: 0,
    bonusPayout: 200,
    totalPayout: 200,
    bonusTriggered: true,
    initialFreeSpins: 10,
    totalFreeSpinsPlayed: 10,
    maxMultiplier: 2,
  },
} as unknown as SlotRound;

test("snapshot сохраняет весь подтверждённый bonus round и восстанавливает его один раз", () => {
  const storage = new MemoryStorage();
  saveRoundPresentation(storage, round, 2_000);
  assert.deepEqual(
    loadRoundPresentation<SlotRound>(storage, {
      gameId: "sweet-lemonza",
      userId: "u-sofia",
      availableRoundIds: new Set([round.id]),
      now: 2_100,
    }),
    round,
  );
  clearRoundPresentation(storage, "sweet-lemonza", "u-sofia");
  assert.equal(
    storage.getItem(roundPresentationKey("sweet-lemonza", "u-sofia")),
    null,
  );
});
test("повреждённый snapshot удаляется", () => {
  const storage = new MemoryStorage(),
    key = roundPresentationKey("sweet-lemonza", "u-sofia");
  storage.setItem(key, "{broken");
  assert.equal(
    loadRoundPresentation(storage, {
      gameId: "sweet-lemonza",
      userId: "u-sofia",
      availableRoundIds: new Set([round.id]),
    }),
    undefined,
  );
  assert.equal(storage.getItem(key), null);
});
test("чужой, просроченный и отсутствующий на сервере round отклоняется", () => {
  for (const mutate of [
    (value: Record<string, unknown>) => {
      value.userId = "u-misha";
    },
    (value: Record<string, unknown>) => {
      value.savedAt = 0;
    },
    (value: Record<string, unknown>) => {
      value.roundId = "missing";
    },
  ]) {
    const storage = new MemoryStorage();
    saveRoundPresentation(storage, round, 2_000);
    const key = roundPresentationKey("sweet-lemonza", "u-sofia"),
      value = JSON.parse(storage.getItem(key)!);
    mutate(value);
    storage.setItem(key, JSON.stringify(value));
    assert.equal(
      loadRoundPresentation(storage, {
        gameId: "sweet-lemonza",
        userId: "u-sofia",
        availableRoundIds: new Set([round.id]),
        now: 2_000 + 25 * 60 * 60 * 1000,
      }),
      undefined,
    );
    assert.equal(storage.getItem(key), null);
  }
});

console.log("Все проверки snapshot показа раунда пройдены.");
