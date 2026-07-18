"use client";

import { useEffect, useMemo, useState } from "react";
import type { BonusDefinition, BonusSpin, UserBonus } from "@/domain/models";

export function BonusWheel({ definitions, initialBonuses, initialSpins, initialNextSpinAt, initialServerTime }: { definitions: BonusDefinition[]; initialBonuses: UserBonus[]; initialSpins: BonusSpin[]; initialNextSpinAt: string; initialServerTime: number }) {
  const [bonuses, setBonuses] = useState(initialBonuses);
  const [spins, setSpins] = useState(initialSpins);
  const [nextSpinAt, setNextSpinAt] = useState(initialNextSpinAt);
  const [now, setNow] = useState(initialServerTime);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<BonusDefinition>();
  const [error, setError] = useState("");
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const wait = Math.max(0, new Date(nextSpinAt).getTime() - now);
  const ready = wait <= 0 && !spinning;
  const timer = `${String(Math.floor(wait / 3_600_000)).padStart(2, "0")}:${String(Math.floor((wait % 3_600_000) / 60_000)).padStart(2, "0")}:${String(Math.floor((wait % 60_000) / 1000)).padStart(2, "0")}`;
  const gradient = useMemo(() => { const step = 360 / definitions.length; return `conic-gradient(${definitions.map((item, index) => `${item.color} ${index * step}deg ${(index + 1) * step}deg`).join(",")})`; }, [definitions]);

  async function spin() {
    setSpinning(true); setResult(undefined); setError("");
    const key = crypto.randomUUID();
    try {
      const response = await fetch("/api/bonuses/spin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: key }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error);
      const index = definitions.findIndex((item) => item.id === body.reward.id);
      const target = 5 * 360 + (360 - (index * (360 / definitions.length) + 180 / definitions.length));
      setRotation((current) => current + target);
      window.setTimeout(() => { setSpinning(false); setResult(body.reward); setNextSpinAt(body.spin.nextSpinAt); setSpins((items) => [body.spin, ...items]); if (body.reward.kind !== "LIRA" && body.reward.kind !== "NONE") setBonuses((items) => [{ id: `fresh-${body.spin.id}`, userId: body.spin.userId, definitionId: body.reward.id, label: body.reward.label, kind: body.reward.kind, value: body.reward.value, status: "AVAILABLE", createdAt: body.spin.createdAt, expiresAt: new Date(new Date(body.spin.createdAt).getTime() + body.reward.validityMinutes * 60_000).toISOString() }, ...items]); }, 4300);
    } catch (e) { setSpinning(false); setError(e instanceof Error ? e.message : "Ошибка вращения"); }
  }

  return <div className="grid gap-8 lg:grid-cols-[1fr_23rem]"><section className="card overflow-hidden"><div className="bg-[#174b38] px-5 py-8 text-center text-white"><p className="eyebrow !text-[#f2cf55]">Fortuna italiana</p><h1 className="serif mt-2 text-3xl font-bold">Колесо синьоры Удачи</h1><p className="mx-auto mt-2 max-w-md text-sm text-white/65">Награду выбирает сервер. Колесо лишь красиво сообщает судьбу.</p></div><div className="grid place-items-center p-6 py-9"><div className="relative"><div className="absolute left-1/2 top-[-12px] z-10 -translate-x-1/2 border-x-[12px] border-t-[24px] border-x-transparent border-t-[#a84735]" /><div className="grid size-[min(76vw,22rem)] place-items-center rounded-full border-[10px] border-[#fffdf7] shadow-[0_10px_40px_rgba(23,75,56,.18)] transition-transform duration-[4200ms] ease-[cubic-bezier(.12,.72,.05,1)]" style={{ background: gradient, transform: `rotate(${rotation}deg)` }}><div className="grid size-20 place-items-center rounded-full border-4 border-[#f2cf55] bg-[#174b38] text-center text-xs font-black uppercase tracking-wider text-white shadow-lg">buona<br />fortuna</div></div></div><button className="btn-primary mt-8 min-w-56" onClick={() => void spin()} disabled={!ready}>{spinning ? "Судьба решает…" : ready ? "Крутить колесо" : `Снова через ${timer}`}</button>{result && <div className="mt-5 rounded-2xl bg-[#f2cf55]/18 px-5 py-3 text-center"><span className="text-xs font-bold uppercase tracking-wider text-[#897027]">Ваша награда</span><strong className="serif mt-1 block text-xl">{result.label}</strong></div>}{error && <p className="mt-4 text-sm font-bold text-[#a84735]">{error}</p>}</div></section><aside className="space-y-5"><section><p className="eyebrow">В кошельке</p><h2 className="serif mt-1 text-2xl font-bold">Мои бонусы</h2><div className="mt-3 space-y-2">{bonuses.length ? bonuses.map((bonus) => <div key={bonus.id} className="card flex items-center gap-3 p-4"><span className="grid size-10 place-items-center rounded-xl bg-[#f2cf55]/20">✦</span><div className="flex-1"><strong className="text-sm">{bonus.label}</strong><small className="block text-[#7b827c]">{bonus.status === "AVAILABLE" ? `до ${new Date(bonus.expiresAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : bonus.status}</small></div><span className="rounded-full bg-[#3f805e]/10 px-2 py-1 text-[.6rem] font-extrabold uppercase text-[#2f684c]">{bonus.status === "AVAILABLE" ? "доступен" : bonus.status}</span></div>) : <div className="card p-4 text-sm text-[#7b827c]">Пока пусто — пора крутить.</div>}</div></section><section><h2 className="serif text-xl font-bold">История</h2><div className="mt-3 space-y-2">{spins.slice(0, 5).map((spin) => { const reward = definitions.find((item) => item.id === spin.definitionId); return <div key={spin.id} className="flex items-center justify-between border-b border-[#174b38]/10 py-2 text-sm"><span>{reward?.label}</span><small className="text-[#7b827c]">{new Date(spin.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</small></div>; })}{!spins.length && <p className="text-sm text-[#7b827c]">Первое вращение ещё впереди.</p>}</div></section><p className="rounded-xl border border-[#174b38]/10 p-3 text-xs leading-relaxed text-[#748078]">Лиры из колеса начисляются сразу. Бесплатная ставка, множитель и возврат имеют срок действия.</p></aside></div>;
}
