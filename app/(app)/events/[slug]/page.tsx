import { notFound } from "next/navigation";
import { BetPanel } from "@/components/bet-panel";
import { formatLira, totalPool } from "@/domain/market";
import {
  getEventBySlug,
  listEvents,
  listUserBonuses,
} from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export function generateStaticParams() {
  return listEvents().map((event) => ({ slug: event.slug }));
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  const user = await currentUser();
  if (!event || !user) notFound();
  return (
    <div className="page-shell">
      <div className="mb-7 flex items-start gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-[1.3rem] bg-[#f2cf55]/25 text-3xl">
          {event.emoji}
        </span>
        <div>
          <p className="eyebrow">{event.category} · стаканы открыты</p>
          <h1 className="serif mt-1 max-w-3xl text-3xl font-bold leading-tight md:text-4xl">
            {event.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6e7a71]">
            {event.description}
          </p>
          <p className="mt-3 text-xs font-bold text-[#8a8c7c]">
            Всего в стаканах {formatLira(totalPool(event.outcomes))}
          </p>
        </div>
      </div>
      <BetPanel
        initialEvent={event}
        initialBalance={user.balance}
        bonuses={listUserBonuses(user.id)}
      />
    </div>
  );
}
