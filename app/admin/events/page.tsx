import Link from "next/link";
import { formatLira, marketView, totalPool } from "@/domain/market";
import { listEvents } from "@/infrastructure/mock/store";
const status: Record<string, string> = {
  OPEN: "Открыто",
  DRAFT: "Черновик",
  CLOSED: "Закрыто",
  RESOLVED: "Рассчитано",
  CANCELLED: "Отменено",
};
export default function AdminEventsPage() {
  const events = listEvents();
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Mercati</p>
          <h1 className="serif mt-1 text-3xl font-bold">События</h1>
        </div>
        <Link href="/admin/events/new" className="btn-primary">
          + Создать событие
        </Link>
      </div>
      <div className="card mt-6 overflow-hidden">
        <div className="hidden grid-cols-[1fr_8rem_8rem_7rem] gap-3 bg-[#174b38] px-5 py-3 text-[.65rem] font-extrabold uppercase tracking-wider text-white/65 md:grid">
          <span>Рынок</span>
          <span>Лидер</span>
          <span>В стаканах</span>
          <span>Статус</span>
        </div>
        {events.map((event) => {
          const leader = [...marketView(event)].sort(
            (a, b) => b.pool - a.pool,
          )[0];
          return (
            <Link
              href={`/admin/events/${event.id}`}
              key={event.id}
              className="grid gap-3 border-b border-[#174b38]/8 p-4 text-inherit no-underline last:border-0 hover:bg-[#174b38]/[.025] md:grid-cols-[1fr_8rem_8rem_7rem] md:items-center md:px-5"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{event.emoji}</span>
                <div>
                  <strong className="block text-sm">{event.title}</strong>
                  <small className="text-[#7c847d]">
                    {event.outcomes.length} исхода · {event.category}
                  </small>
                </div>
              </div>
              <span className="text-xs font-bold">
                {leader.title}
                <small className="block text-[#80877f]">
                  {leader.probabilityBps / 100}%
                </small>
              </span>
              <strong className="text-sm">
                {formatLira(totalPool(event.outcomes))}
              </strong>
              <span className="w-fit rounded-full bg-[#3b7858]/10 px-2 py-1 text-[.6rem] font-extrabold uppercase text-[#35694f]">
                {status[event.status]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
