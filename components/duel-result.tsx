"use client";

import type { Duel, User } from "@/domain/models";
import { cardRankLabel, cardSuitLabel, DUEL_GAME_META, SLOT_SYMBOL_META } from "@/domain/duels";
import { formatLira } from "@/domain/market";

const combinationLabel = { THREE: "Тройка", PAIR: "Пара", HIGH: "Старший символ" };

function PlayerResult({ duel, side }: { duel: Duel; side: "challenger" | "opponent" }) {
  const result = duel.result;
  if (!result) return null;
  if (result.game === "HIGH_CARD") {
    const card = side === "challenger" ? result.challengerCard : result.opponentCard;
    const suit = cardSuitLabel(card.suit);
    const red = card.suit === "HEARTS" || card.suit === "DIAMONDS";
    return <div className={`mx-auto grid h-28 w-20 place-items-center rounded-xl border-2 bg-white text-3xl font-black shadow-lg ${red ? "border-[#b84c3a] text-[#b84c3a]" : "border-[#174b38] text-[#174b38]"}`}><span>{cardRankLabel(card.rank)}<small className="block text-center text-2xl">{suit}</small></span></div>;
  }
  if (result.game === "DICE") {
    const dice = side === "challenger" ? result.challengerDice : result.opponentDice;
    return <div><div className="flex justify-center gap-2">{dice.map((die, index) => <span key={index} className="grid size-14 place-items-center rounded-xl bg-white text-2xl font-black shadow-md">{["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][die - 1]}</span>)}</div><strong className="mt-2 block text-center text-sm">Сумма {dice[0] + dice[1]}</strong></div>;
  }
  const slots = side === "challenger" ? result.challengerSlots : result.opponentSlots;
  const combination = side === "challenger" ? result.challengerCombination : result.opponentCombination;
  return <div><div className="flex justify-center gap-1.5 rounded-xl bg-[#174b38] p-2">{slots.map((symbol, index) => <span key={index} className="grid size-14 place-items-center rounded-lg bg-white text-2xl shadow-inner">{SLOT_SYMBOL_META[symbol].emoji}</span>)}</div><strong className="mt-2 block text-center text-sm">{combinationLabel[combination]}</strong></div>;
}

export function DuelResultView({ duel, users, currentUserId, revealed }: { duel: Duel; users: User[]; currentUserId: string; revealed: boolean }) {
  const challenger = users.find((user) => user.id === duel.challengerId);
  const opponent = users.find((user) => user.id === duel.opponentId);
  const winner = users.find((user) => user.id === duel.winnerId);
  return <div className="text-center">
    <p className="eyebrow">{DUEL_GAME_META[duel.game].title}</p>
    <h2 className="serif mt-1 text-3xl font-bold">{revealed ? (duel.winnerId === currentUserId ? "Vittoria! Вы победили" : `${winner?.displayName ?? "Соперник"} побеждает`) : "Синьора Удача решает…"}</h2>
    <div className={`mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 transition duration-700 ${revealed ? "opacity-100" : "scale-90 opacity-25 blur-sm"}`}>
      <div><PlayerResult duel={duel} side="challenger" /><strong className="mt-3 block text-sm">{challenger?.displayName}</strong></div>
      <span className="serif text-xl font-black text-[#b5812c]">VS</span>
      <div><PlayerResult duel={duel} side="opponent" /><strong className="mt-3 block text-sm">{opponent?.displayName}</strong></div>
    </div>
    {revealed && <div className="mt-6 rounded-2xl bg-[#f2cf55]/18 p-4"><span className="text-xs font-bold uppercase tracking-wider text-[#88702b]">Банк победителя</span><strong className="serif mt-1 block text-3xl text-[#174b38]">{formatLira(duel.pot)}</strong>{duel.result && duel.result.redraws > 0 && <small className="text-[#7c806e]">Ничьих до результата: {duel.result.redraws}</small>}</div>}
  </div>;
}
