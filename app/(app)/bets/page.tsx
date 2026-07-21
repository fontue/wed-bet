import { BetHistoryCard } from "@/components/bet-history-card";
import { listEvents, listUserBets } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export default async function BetsPage() {
  const user = await currentUser();
  if (!user) return null;
  const bets = listUserBets(user.id);
  const events = listEvents();
  const groups = [
    { title: "Активные", statuses: ["ACCEPTED"] },
    { title: "Выигранные", statuses: ["WON"] },
    { title: "Проигранные и возвращённые", statuses: ["LOST", "REFUNDED"] },
  ];
  return (
    <div className="page-shell">
      <p className="eyebrow">Il mio biglietto</p>
      <h1 className="serif mt-1 text-3xl font-bold">Мои ставки</h1>
      <p className="mt-2 text-sm text-[#6e7a71]">
        Принятые сервером прогнозы и их финальный результат.
      </p>
      <div className="mt-7 space-y-9">
        {groups.map((group) => {
          const items = bets.filter((bet) =>
            group.statuses.includes(bet.status),
          );
          return (
            <section key={group.title}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="serif text-xl font-bold">{group.title}</h2>
                <span className="rounded-full bg-[#174b38]/8 px-2 py-0.5 text-xs font-bold">
                  {items.length}
                </span>
              </div>
              {items.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((bet) => (
                    <BetHistoryCard
                      key={bet.id}
                      bet={bet}
                      event={events.find((event) => event.id === bet.eventId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="card p-6 text-center text-sm text-[#7b827b]">
                  Здесь пока тихо, как до первого тоста.
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
