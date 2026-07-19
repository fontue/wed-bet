import assert from "node:assert/strict";
import { DUEL_POT, DUEL_STAKE, generateDuelResult } from "../domain/duels.ts";
import type { DuelGame } from "../domain/models.ts";
import {
  acceptDuel,
  cancelDuel,
  createDuel,
  declineDuel,
  getDuelById,
  getUser,
  listEligibleDuelOpponents,
  store,
} from "../infrastructure/mock/store.ts";

function test(name: string, run: () => void) {
  try { run(); console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}

test("каждая серверная игра всегда выбирает одного победителя", () => {
  for (const game of ["HIGH_CARD", "DICE", "SLOTS"] as DuelGame[]) {
    let seed = 17;
    const random = (max: number) => { seed = (seed * 48_271) % 2_147_483_647; return seed % max; };
    for (let index = 0; index < 250; index += 1) {
      const generated = generateDuelResult(game, random);
      assert.ok(generated.winner === "CHALLENGER" || generated.winner === "OPPONENT");
      assert.equal(generated.result.game, game);
    }
  }
});

test("создание списывает 200 лир и повтор не списывает ещё раз", () => {
  const before = getUser("u-sofia")!.balance;
  const first = createDuel({ challengerId: "u-sofia", opponentId: "u-misha", game: "HIGH_CARD", idempotencyKey: "test-create" });
  const repeated = createDuel({ challengerId: "u-sofia", opponentId: "u-misha", game: "HIGH_CARD", idempotencyKey: "test-create" });
  assert.equal(first.duel.id, repeated.duel.id);
  assert.equal(getUser("u-sofia")!.balance, before - DUEL_STAKE);
});

test("принятие списывает второй взнос и начисляет победителю весь банк один раз", () => {
  const duel = store.duels.find((item) => item.createIdempotencyKey === "test-create")!;
  const totalBeforeAccept = getUser("u-sofia")!.balance + getUser("u-misha")!.balance;
  const accepted = acceptDuel({ duelId: duel.id, opponentId: "u-misha", idempotencyKey: "test-accept" });
  const totalAfterAccept = getUser("u-sofia")!.balance + getUser("u-misha")!.balance;
  assert.equal(accepted.duel.status, "RESOLVED");
  assert.equal(accepted.duel.pot, DUEL_POT);
  assert.ok(accepted.duel.winnerId);
  assert.equal(totalAfterAccept, totalBeforeAccept - DUEL_STAKE + DUEL_POT);
  const balances = [getUser("u-sofia")!.balance, getUser("u-misha")!.balance];
  const repeated = acceptDuel({ duelId: duel.id, opponentId: "u-misha", idempotencyKey: "another-accept-key" });
  assert.equal(repeated.duel.winnerId, accepted.duel.winnerId);
  assert.deepEqual([getUser("u-sofia")!.balance, getUser("u-misha")!.balance], balances);
  assert.equal(store.transactions.filter((item) => item.operationKey === `duel:${duel.id}:win`).length, 1);
});

test("отмена и отказ возвращают зарезервированный взнос", () => {
  const beforeCancel = getUser("u-sofia")!.balance;
  const cancelled = createDuel({ challengerId: "u-sofia", opponentId: "u-lena", game: "DICE", idempotencyKey: "test-cancel-create" }).duel;
  assert.equal(getUser("u-sofia")!.balance, beforeCancel - DUEL_STAKE);
  cancelDuel({ duelId: cancelled.id, actorId: "u-sofia", idempotencyKey: "test-cancel" });
  assert.equal(getUser("u-sofia")!.balance, beforeCancel);

  const beforeDecline = getUser("u-sofia")!.balance;
  const declined = createDuel({ challengerId: "u-sofia", opponentId: "u-anton", game: "SLOTS", idempotencyKey: "test-decline-create" }).duel;
  declineDuel({ duelId: declined.id, opponentId: "u-anton", idempotencyKey: "test-decline" });
  assert.equal(getUser("u-sofia")!.balance, beforeDecline);
});

test("истёкший вызов возвращает взнос автоматически", () => {
  const before = getUser("u-sofia")!.balance;
  const duel = createDuel({ challengerId: "u-sofia", opponentId: "u-lena", game: "HIGH_CARD", idempotencyKey: "test-expire-create" }).duel;
  const stored = store.duels.find((item) => item.id === duel.id)!;
  stored.expiresAt = new Date(0).toISOString();
  assert.equal(getDuelById(duel.id)!.status, "EXPIRED");
  assert.equal(getUser("u-sofia")!.balance, before);
});

test("администратор и сам игрок не попадают в список соперников", () => {
  const opponents = listEligibleDuelOpponents("u-sofia");
  assert.ok(!opponents.some((user) => user.id === "u-sofia" || user.role === "ADMIN" || user.status !== "ACTIVE"));
});

test("игрок с балансом меньше 200 лир не может создать вызов", () => {
  const user = store.users.find((item) => item.id === "u-lena")!;
  const originalBalance = user.balance;
  user.balance = DUEL_STAKE - 1;
  assert.throws(() => createDuel({ challengerId: user.id, opponentId: "u-misha", game: "DICE", idempotencyKey: "test-low-balance" }), /INSUFFICIENT_BALANCE/);
  user.balance = originalBalance;
});

console.log("Все проверки дуэлей пройдены.");
