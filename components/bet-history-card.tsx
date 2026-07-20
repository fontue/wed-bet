import Link from "next/link";
import type { Bet, MarketEvent } from "@/domain/models";
import { formatCoefficient, formatLira } from "@/domain/market";

const statusLabel = { ACCEPTED: "Активна", WON: "Выигрыш", LOST: "Проигрыш", REFUNDED: "Возврат" };
const statusStyle = { ACCEPTED: "bg-[#d7a642]/12 text-[#89671f]", WON: "bg-[#3c805c]/10 text-[#2d694a]", LOST: "bg-[#a84735]/9 text-[#944334]", REFUNDED: "bg-[#65786e]/10 text-[#52685d]" };

export function BetHistoryCard({ bet, event }: { bet: Bet; event?: MarketEvent }) {
  const outcome = event?.outcomes.find((item) => item.id === bet.outcomeId);
  return (
    <article className="card p-4">
      <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f2cf55]/18 text-xl">{event?.emoji ?? "🎟️"}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-extrabold leading-tight">{event?.title ?? "Архивное событие"}</h3><p className="mt-1 text-sm text-[#6f7b72]">{outcome?.title ?? "Выбранный исход"}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[.65rem] font-extrabold uppercase ${statusStyle[bet.status]}`}>{statusLabel[bet.status]}</span></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#174b38]/8 pt-3 text-xs"><span className="text-[#7b827b]">Ставка<strong className="mt-1 block text-sm text-[#174b38]">{formatLira(bet.amount)}</strong></span><span className="text-[#7b827b]">При входе<strong className="mt-1 block text-sm text-[#174b38]">X{formatCoefficient(bet.projectedCoefficient)}</strong></span><span className="text-right text-[#7b827b]">Выплата<strong className="mt-1 block text-sm text-[#174b38]">{bet.payout === undefined ? "ждём" : formatLira(bet.payout)}</strong></span></div>{event && <Link href={`/events/${event.slug}`} className="mt-3 inline-block text-xs font-extrabold text-[#b17e29]">Открыть рынок →</Link>}</div></div>
    </article>
  );
}
