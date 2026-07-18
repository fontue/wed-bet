"use client";

import { useMemo, useState } from "react";
import type { MarketEvent, UserBonus } from "@/domain/models";
import { formatCoefficient, formatLira, formatProbability, marketView, quoteBet } from "@/domain/market";
import { ProbabilityBar } from "./probability-bar";
import { queueBet } from "@/lib/outbox";

type SubmitState = "idle" | "confirm" | "sending" | "queued" | "success" | "error";

export function BetPanel({ initialEvent, initialBalance, bonuses }: { initialEvent: MarketEvent; initialBalance: number; bonuses: UserBonus[] }) {
  const [event, setEvent] = useState(initialEvent);
  const [balance, setBalance] = useState(initialBalance);
  const [outcomeId, setOutcomeId] = useState(event.outcomes[0]?.id ?? "");
  const [amount, setAmount] = useState(100);
  const [bonusId, setBonusId] = useState<string | undefined>();
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const outcomes = useMemo(() => marketView(event), [event]);
  const selected = outcomes.find((item) => item.id === outcomeId);
  const quote = useMemo(() => { try { return quoteBet(event, outcomeId, amount); } catch { return null; } }, [event, outcomeId, amount]);
  const selectedBonus = bonuses.find((bonus) => bonus.id === bonusId);
  const maxStake = selectedBonus?.kind === "FREE_BET" ? selectedBonus.value : balance;
  const valid = Boolean(selected && quote && amount > 0 && Number.isInteger(amount) && amount <= maxStake);

  async function submit() {
    if (!valid || !quote) return;
    const payload = { eventId: event.id, outcomeId, amount, bonusId, idempotencyKey: crypto.randomUUID(), queuedAt: new Date().toISOString() };
    if (!navigator.onLine) {
      await queueBet(payload); setState("queued"); setMessage("Ставка ждёт сеть. Она ещё не принята и отправится после восстановления соединения."); return;
    }
    setState("sending");
    try {
      const response = await fetch("/api/bets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setEvent(body.event); setBalance(body.balance); setState("success");
      setMessage(`Ставка принята сервером. Коэффициент сейчас ×${formatCoefficient(body.bet.projectedCoefficient)}.`);
    } catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Не удалось принять ставку"); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_23rem]">
      <section>
        <div className="space-y-3">
          {outcomes.map((outcome) => {
            const active = outcome.id === outcomeId;
            return <button key={outcome.id} onClick={() => { setOutcomeId(outcome.id); setState("idle"); }} className={`card w-full p-4 text-left transition ${active ? "border-[#c9983c] ring-2 ring-[#c9983c]/15" : "hover:border-[#174b38]/30"}`}>
              <div className="flex items-center gap-3"><span className={`grid size-6 place-items-center rounded-full border-2 ${active ? "border-[#174b38] bg-[#174b38] text-white" : "border-[#174b38]/20"}`}>{active ? "✓" : ""}</span><span className="min-w-0 flex-1 font-extrabold">{outcome.title}</span><span className="text-right"><strong className="block text-lg text-[#174b38]">{formatProbability(outcome.probabilityBps)}</strong><small className="text-[#7a8177]">{formatLira(outcome.pool)} · {outcome.bettorsCount} чел.</small></span></div>
            </button>;
          })}
        </div>
        <div className="card mt-4 p-4"><ProbabilityBar outcomes={outcomes} /><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#758078]">{outcomes.map((outcome) => <span key={outcome.id}><b>{outcome.title}</b> {formatProbability(outcome.probabilityBps)}</span>)}</div></div>
      </section>

      <aside className="card h-fit p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Ваш прогноз</p><h2 className="serif mt-1 text-xl font-bold">Поставить лиры</h2></div><span className="rounded-full bg-[#174b38]/7 px-3 py-1.5 text-xs font-extrabold">Баланс {formatLira(balance)}</span></div>
        <label className="mt-5 block text-xs font-extrabold uppercase tracking-wider text-[#617267]">Сумма</label>
        <div className="relative mt-2"><input className="input pr-12 text-xl font-black" inputMode="numeric" type="number" min={1} step={1} max={maxStake} value={amount} onChange={(e) => { setAmount(Number(e.target.value)); setState("idle"); }} /><span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#c49337]">₤</span></div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">{[50, 100, 250, 500].map((value) => <button key={value} onClick={() => setAmount(Math.min(value, maxStake))} className="rounded-lg bg-[#174b38]/6 py-2 text-xs font-extrabold text-[#426052]">+{value}</button>)}</div>
        {bonuses.filter((bonus) => bonus.status === "AVAILABLE").length > 0 && <><label className="mt-4 block text-xs font-extrabold uppercase tracking-wider text-[#617267]">Бонус</label><select className="input mt-2 text-sm" value={bonusId ?? ""} onChange={(e) => setBonusId(e.target.value || undefined)}><option value="">Без бонуса</option>{bonuses.filter((bonus) => bonus.status === "AVAILABLE").map((bonus) => <option key={bonus.id} value={bonus.id}>{bonus.label}</option>)}</select></>}
        {amount > maxStake && <p className="mt-2 text-xs font-bold text-[#a84735]">Доступно не больше {formatLira(maxStake)}</p>}
        {quote && selected && <div className="mt-5 rounded-2xl bg-[#174b38] p-4 text-white"><div className="flex items-end justify-between"><span className="text-xs text-white/65">Коэффициент этой ставки</span><strong className="text-3xl">×{formatCoefficient(quote.coefficient)}</strong></div><div className="mt-3 flex justify-between border-t border-white/15 pt-3 text-sm"><span className="text-white/65">Если закроется сейчас</span><strong>{formatLira(quote.projectedPayout)}</strong></div></div>}
        <button className="btn-primary mt-4 w-full" disabled={!valid || state === "sending"} onClick={() => setState("confirm")}>{state === "sending" ? "Отправляем…" : "Продолжить"}</button>
        {(["queued", "success", "error"] as SubmitState[]).includes(state) && <div className={`mt-3 rounded-xl p-3 text-sm font-bold ${state === "success" ? "bg-[#3f805e]/10 text-[#286347]" : state === "queued" ? "bg-[#c9983c]/12 text-[#896728]" : "bg-[#a84735]/10 text-[#963f31]"}`}>{message}</div>}
      </aside>

      {state === "confirm" && quote && selected && <div className="fixed inset-0 z-[80] grid items-end bg-[#102c22]/55 p-3 backdrop-blur-sm sm:place-items-center" onMouseDown={(e) => { if (e.currentTarget === e.target) setState("idle"); }}><section className="card w-full max-w-md p-6"><div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#174b38]/15 sm:hidden" /><p className="eyebrow">Conferma</p><h2 className="serif mt-1 text-2xl font-bold">Подтвердить ставку</h2><div className="mt-5 space-y-3 rounded-2xl bg-[#f6f0e2] p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-[#758078]">Исход</span><strong className="text-right">{selected.title}</strong></div><div className="flex justify-between"><span className="text-[#758078]">Сумма</span><strong>{formatLira(amount)}</strong></div><div className="flex justify-between"><span className="text-[#758078]">Коэффициент ставки</span><strong className="text-lg text-[#174b38]">×{formatCoefficient(quote.coefficient)}</strong></div><div className="flex justify-between"><span className="text-[#758078]">Выплата сейчас</span><strong>{formatLira(quote.projectedPayout)}</strong></div></div><p className="mt-4 rounded-xl border border-[#c9983c]/25 bg-[#f2cf55]/12 p-3 text-xs leading-relaxed text-[#715f34]">Коэффициент продолжит меняться до закрытия стаканов. Итоговая выплата зависит от всех последующих ставок. Ставку нельзя отменить.</p><div className="mt-5 grid grid-cols-2 gap-2"><button className="btn-secondary" onClick={() => setState("idle")}>Назад</button><button className="btn-primary" onClick={() => void submit()}>Поставить {formatLira(amount)}</button></div></section></div>}
    </div>
  );
}
