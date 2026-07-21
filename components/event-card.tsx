import Link from "next/link";
import {
  formatCoefficient,
  formatLira,
  formatProbability,
  marketView,
  totalPool,
} from "@/domain/market";
import type { MarketEvent } from "@/domain/models";
import { ProbabilityBar } from "./probability-bar";

function closeLabel(value: string) {
  const minutes = Math.max(
    0,
    Math.round((new Date(value).getTime() - Date.now()) / 60_000),
  );
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
}

export function EventCard({
  event,
  featured = false,
}: {
  event: MarketEvent;
  featured?: boolean;
}) {
  const outcomes = marketView(event);
  const leader = [...outcomes].sort(
    (a, b) => b.probabilityBps - a.probabilityBps,
  )[0];
  return (
    <Link
      href={`/events/${event.slug}`}
      className={`card group block overflow-hidden text-inherit no-underline transition hover:-translate-y-0.5 hover:shadow-lg ${featured ? "md:col-span-2" : ""}`}
    >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-[#174b38]/7 px-2.5 py-1 text-[.65rem] font-extrabold uppercase tracking-wider text-[#376450]">
            {event.category}
          </span>
          <span className="text-xs font-bold text-[#8a8b7a]">
            закроется через {closeLabel(event.closesAt)}
          </span>
        </div>
        <div className="flex gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#f2cf55]/25 text-2xl">
            {event.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="serif text-xl font-bold leading-tight text-[#174b38] group-hover:text-[#28654f]">
              {event.title}
            </h3>
            <p className="mt-1.5 text-sm text-[#738078]">
              Лидер: <strong className="text-[#174b38]">{leader.title}</strong>{" "}
              · {formatProbability(leader.probabilityBps)}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <ProbabilityBar outcomes={outcomes} />
        </div>
        <div className="mt-4 space-y-2.5">
          {outcomes.slice(0, featured ? 4 : 3).map((outcome) => (
            <div key={outcome.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-bold text-[#36584b]">
                {outcome.title}
              </span>
              <span className="text-xs text-[#83897d]">
                {formatProbability(outcome.probabilityBps)}
              </span>
              <span className="min-w-14 rounded-lg bg-[#174b38]/7 px-2 py-1 text-center font-black text-[#174b38]">
                X{formatCoefficient(outcome.coefficient)}
              </span>
            </div>
          ))}
          {outcomes.length > (featured ? 4 : 3) && (
            <p className="text-xs font-bold text-[#a07831]">
              + ещё {outcomes.length - 3} исход
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#174b38]/8 bg-[#f9f5ea] px-5 py-3 text-xs font-bold text-[#778078]">
        <span>В стаканах {formatLira(totalPool(event.outcomes))}</span>
        <span>
          {event.outcomes.reduce((sum, item) => sum + item.bettorsCount, 0)}{" "}
          прогнозов →
        </span>
      </div>
    </Link>
  );
}
