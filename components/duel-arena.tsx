"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Duel, DuelGame, User } from "@/domain/models";
import { DUEL_GAME_META, DUEL_POT, DUEL_STAKE } from "@/domain/duels";
import { formatLira } from "@/domain/market";
import { DuelResultView } from "./duel-result";

interface DuelStateDto {
  incoming: Duel[];
  outgoing: Duel[];
  recent: Duel[];
  opponents: User[];
  users: User[];
  stats: { played: number; wins: number; losses: number; profit: number };
  balance: number;
  serverTime: number;
}

const statusLabels = { RESOLVED: "Рассчитана", DECLINED: "Отклонена", CANCELLED: "Отменена", EXPIRED: "Истекла", PENDING: "Ожидает" };

export function DuelArena({ currentUser, initialBalance, initialState }: { currentUser: User; initialBalance: number; initialState: DuelStateDto }) {
  const [state, setState] = useState(initialState);
  const [balance, setBalance] = useState(initialBalance);
  const [now, setNow] = useState(initialState.serverTime);
  const [createOpen, setCreateOpen] = useState(false);
  const [game, setGame] = useState<DuelGame>("HIGH_CARD");
  const [opponentId, setOpponentId] = useState(initialState.opponents[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [resultDuel, setResultDuel] = useState<Duel>();
  const [revealed, setRevealed] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/duels", { cache: "no-store" });
      if (response.ok) { const body = await response.json(); setState(body); setBalance(body.balance); }
    } catch { /* offline state stays visible */ }
  }, []);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const polling = window.setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) void refresh(); }, 10_000);
    const visible = () => { if (document.visibilityState === "visible" && navigator.onLine) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(clock); clearInterval(polling); document.removeEventListener("visibilitychange", visible); };
  }, [refresh]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("wedbet:balance", { detail: balance }));
  }, [balance]);

  const users = useMemo(() => {
    const map = new Map<string, User>();
    for (const user of [currentUser, ...state.opponents, ...state.users]) map.set(user.id, user);
    return [...map.values()];
  }, [currentUser, state.opponents, state.users]);
  const userName = (id: string) => users.find((user) => user.id === id)?.displayName ?? "Гость";

  function requireOnline(): boolean {
    if (navigator.onLine) return true;
    setMessage("Дуэли требуют соединения с сервером и не отправляются из offline-очереди.");
    return false;
  }

  async function createChallenge() {
    if (!requireOnline() || !opponentId) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/duels", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ opponentId, game, idempotencyKey: crypto.randomUUID() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setBalance(body.balance); setCreateOpen(false); setMessage(`Вызов для ${userName(opponentId)} отправлен. ${formatLira(DUEL_STAKE)} зарезервированы.`); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось создать дуэль"); }
    finally { setBusy(false); }
  }

  async function duelAction(duel: Duel, action: "accept" | "decline" | "cancel" | "rematch") {
    if (!requireOnline()) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/duels/${duel.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, idempotencyKey: crypto.randomUUID() }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (typeof body.balance === "number") setBalance(body.balance);
      if (action === "accept") {
        setResultDuel(body.duel); setRevealed(false);
        window.setTimeout(() => setRevealed(true), 1500);
      } else if (action === "rematch") setMessage("Реванш отправлен. Соперник должен принять новый вызов.");
      else setMessage(action === "decline" ? "Вызов отклонён, сопернику вернутся лиры." : "Вызов отменён, лиры возвращены.");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось выполнить действие"); }
    finally { setBusy(false); }
  }

  return <div>
    <section className="relative overflow-hidden rounded-[1.8rem] bg-[#174b38] px-6 py-8 text-white md:px-9">
      <div className="absolute -right-10 -top-14 text-[10rem] opacity-10">⚔</div>
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow !text-[#f2cf55]">Sfida d’onore</p><h1 className="serif mt-2 text-4xl font-bold">Свадебные дуэли</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">Выберите соперника, доверьтесь фортуне и заберите весь банк. По 200 лир с каждого, никаких комиссий.</p></div><button className="btn-primary !bg-[#f2cf55] !text-[#174b38]" onClick={() => setCreateOpen(true)} disabled={balance < DUEL_STAKE}>⚔ Бросить вызов</button></div>
    </section>

    <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">{[
      ["Дуэлей", state.stats.played], ["Побед", state.stats.wins], ["Поражений", state.stats.losses], ["Прибыль", `${state.stats.profit >= 0 ? "+" : ""}${formatLira(state.stats.profit)}`],
    ].map(([label, value]) => <div className="card p-4" key={label}><span className="text-xs font-bold text-[#7b837c]">{label}</span><strong className="serif mt-1 block text-2xl">{value}</strong></div>)}</div>

    {message && <div className="mt-4 rounded-xl border border-[#c9983c]/20 bg-[#f2cf55]/13 p-3 text-sm font-bold text-[#715f34]">{message}</div>}

    {(state.incoming.length > 0 || state.outgoing.length > 0) && <section className="mt-8"><p className="eyebrow">Вызовы</p><h2 className="serif mt-1 text-2xl font-bold">Ждут решения</h2><div className="mt-4 grid gap-3 lg:grid-cols-2">
      {state.incoming.map((duel) => <article className="card border-[#c9983c]/35 p-5" key={duel.id}><div className="flex gap-3"><span className="grid size-12 place-items-center rounded-xl bg-[#f2cf55]/20 text-2xl">{DUEL_GAME_META[duel.game].emoji}</span><div className="flex-1"><span className="text-xs font-bold uppercase tracking-wider text-[#a1762a]">Вас вызывают</span><h3 className="mt-1 font-extrabold">{userName(duel.challengerId)}</h3><p className="text-sm text-[#6e7a71]">{DUEL_GAME_META[duel.game].title} · банк {formatLira(duel.pot)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button className="btn-secondary" disabled={busy} onClick={() => void duelAction(duel, "decline")}>Отклонить</button><button className="btn-primary" disabled={busy || balance < duel.stake} onClick={() => void duelAction(duel, "accept")}>Принять за {formatLira(duel.stake)}</button></div></article>)}
      {state.outgoing.map((duel) => { const seconds = Math.max(0, Math.ceil((new Date(duel.expiresAt).getTime() - now) / 1000)); return <article className="card p-5" key={duel.id}><div className="flex gap-3"><span className="grid size-12 place-items-center rounded-xl bg-[#174b38]/7 text-2xl">{DUEL_GAME_META[duel.game].emoji}</span><div className="flex-1"><span className="text-xs font-bold uppercase tracking-wider text-[#6f7b72]">Исходящий вызов</span><h3 className="mt-1 font-extrabold">{userName(duel.opponentId)}</h3><p className="text-sm text-[#6e7a71]">Ответ в течение {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</p></div></div><button className="btn-secondary mt-4 w-full" disabled={busy} onClick={() => void duelAction(duel, "cancel")}>Отменить и вернуть {formatLira(duel.stake)}</button></article>; })}
    </div></section>}

    <section className="mt-9"><p className="eyebrow">Giochi</p><h2 className="serif mt-1 text-2xl font-bold">Три способа испытать удачу</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{(Object.entries(DUEL_GAME_META) as Array<[DuelGame, typeof DUEL_GAME_META[DuelGame]]>).map(([key, meta]) => <button key={key} onClick={() => { setGame(key); setCreateOpen(true); }} className="card group p-5 text-left transition hover:-translate-y-1 hover:border-[#c9983c]/50"><span className="text-4xl">{meta.emoji}</span><h3 className="serif mt-4 text-xl font-bold group-hover:text-[#28654f]">{meta.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#6d7970]">{meta.description}</p><span className="mt-4 inline-block text-xs font-extrabold text-[#ad7b2b]">Банк {formatLira(DUEL_POT)} →</span></button>)}</div></section>

    <section className="mt-9"><div className="flex items-end justify-between"><div><p className="eyebrow">Archivio</p><h2 className="serif mt-1 text-2xl font-bold">Последние дуэли</h2></div></div><div className="mt-4 grid gap-3 md:grid-cols-2">{state.recent.length ? state.recent.map((duel) => <button key={duel.id} onClick={() => { if (duel.status === "RESOLVED") { setResultDuel(duel); setRevealed(true); } }} className="card flex items-center gap-3 p-4 text-left"><span className="grid size-11 place-items-center rounded-xl bg-[#174b38]/7 text-xl">{DUEL_GAME_META[duel.game].emoji}</span><div className="min-w-0 flex-1"><strong className="block truncate">{userName(duel.challengerId)} vs {userName(duel.opponentId)}</strong><small className="text-[#7b827c]">{DUEL_GAME_META[duel.game].title} · {statusLabels[duel.status]}</small></div>{duel.status === "RESOLVED" && <span className={`rounded-full px-2 py-1 text-[.62rem] font-extrabold uppercase ${duel.winnerId === currentUser.id ? "bg-[#3f805e]/10 text-[#2d6d4c]" : "bg-[#a84735]/8 text-[#9b4636]"}`}>{duel.winnerId === currentUser.id ? "победа" : "поражение"}</span>}</button>) : <div className="card p-6 text-center text-sm text-[#7b827c] md:col-span-2">Первая легендарная дуэль ещё впереди.</div>}</div></section>

    {createOpen && <div className="fixed inset-0 z-[85] grid items-end bg-[#102c22]/55 p-3 backdrop-blur-sm sm:place-items-center" onMouseDown={(event) => { if (event.currentTarget === event.target) setCreateOpen(false); }}><section className="card w-full max-w-lg p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Новый вызов</p><h2 className="serif mt-1 text-2xl font-bold">Кого испытываем?</h2></div><button onClick={() => setCreateOpen(false)} className="grid size-9 place-items-center rounded-full bg-[#174b38]/7 text-lg">×</button></div><label className="mt-5 block text-xs font-extrabold uppercase tracking-wider">Игра</label><div className="mt-2 grid grid-cols-3 gap-2">{(Object.entries(DUEL_GAME_META) as Array<[DuelGame, typeof DUEL_GAME_META[DuelGame]]>).map(([key, meta]) => <button key={key} onClick={() => setGame(key)} className={`rounded-xl border p-3 text-center ${game === key ? "border-[#c9983c] bg-[#f2cf55]/13" : "border-[#174b38]/10"}`}><span className="block text-2xl">{meta.emoji}</span><small className="mt-1 block font-bold">{meta.title}</small></button>)}</div><label className="mt-5 block text-xs font-extrabold uppercase tracking-wider">Соперник</label><select className="input mt-2" value={opponentId} onChange={(event) => setOpponentId(event.target.value)}>{state.opponents.map((opponent) => <option key={opponent.id} value={opponent.id}>{opponent.displayName}{opponent.tableNumber ? ` · стол ${opponent.tableNumber}` : ""}</option>)}</select><div className="mt-5 rounded-2xl bg-[#174b38] p-4 text-white"><div className="flex justify-between text-sm"><span className="text-white/65">Ваш взнос</span><strong>{formatLira(DUEL_STAKE)}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-white/65">Общий банк</span><strong className="text-[#f2cf55]">{formatLira(DUEL_POT)}</strong></div><p className="mt-3 border-t border-white/15 pt-3 text-xs leading-relaxed text-white/60">Лиры резервируются сразу. Если соперник откажется или не ответит за 10 минут, взнос вернётся автоматически.</p></div><button className="btn-primary mt-4 w-full" disabled={busy || !opponentId || balance < DUEL_STAKE} onClick={() => void createChallenge()}>Отправить вызов за {formatLira(DUEL_STAKE)}</button></section></div>}

    {resultDuel && <div className="fixed inset-0 z-[95] grid items-end bg-[#102c22]/65 p-3 backdrop-blur-md sm:place-items-center"><section className="card w-full max-w-xl p-6"><DuelResultView duel={resultDuel} users={users} currentUserId={currentUser.id} revealed={revealed} />{revealed && <div className="mt-6 grid grid-cols-2 gap-2"><button className="btn-secondary" onClick={() => setResultDuel(undefined)}>Закрыть</button><button className="btn-primary" disabled={busy || balance < DUEL_STAKE} onClick={() => { void duelAction(resultDuel, "rematch"); setResultDuel(undefined); }}>Реванш</button></div>}</section></div>}
  </div>;
}
