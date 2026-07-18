"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MarketEvent } from "@/domain/models";

export function AdminEventActions({ event }: { event: MarketEvent }) {
  const router = useRouter(); const [winner, setWinner] = useState(event.outcomes[0]?.id ?? ""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function act(action: "resolve" | "cancel") { if (action === "resolve" && !window.confirm("Рассчитать рынок по выбранному исходу? Начисления будут проведены сразу.")) return; if (action === "cancel" && !window.confirm("Отменить событие и вернуть все ставки?")) return; setBusy(true); const response = await fetch(`/api/admin/events/${event.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, winningOutcomeId: winner }) }); const body = await response.json(); setBusy(false); setMessage(response.ok ? (action === "resolve" ? "Событие рассчитано" : "Ставки возвращены") : body.error); router.refresh(); }
  if (["RESOLVED", "CANCELLED"].includes(event.status)) return <p className="rounded-xl bg-[#174b38]/7 p-3 text-sm font-bold">Операция завершена: {event.status === "RESOLVED" ? "рынок рассчитан" : "событие отменено"}.</p>;
  return <div className="space-y-3"><label className="block text-xs font-extrabold uppercase tracking-wider text-[#6c796f]">Победивший исход</label><select className="input" value={winner} onChange={(e) => setWinner(e.target.value)}>{event.outcomes.map((outcome) => <option value={outcome.id} key={outcome.id}>{outcome.title}</option>)}</select><button className="btn-primary w-full" disabled={busy} onClick={() => void act("resolve")}>Закрыть и рассчитать</button><button className="btn-secondary w-full !text-[#a84735]" disabled={busy} onClick={() => void act("cancel")}>Отменить с возвратом</button>{message && <p className="text-center text-xs font-bold text-[#596c61]">{message}</p>}</div>;
}
