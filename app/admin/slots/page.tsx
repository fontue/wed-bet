import { AdminDogHouseSettings } from "@/components/admin-dog-house-settings";
import { AdminLemonzaSettings } from "@/components/admin-lemonza-settings";
import { formatLira } from "@/domain/market";
import {
  getDogHouseAdminState,
  getSweetLemonzaAdminState,
  listUsers,
} from "@/infrastructure/mock/store";
export default async function AdminSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams,
    lemonza = getSweetLemonzaAdminState(q),
    dogs = getDogHouseAdminState(q),
    users = listUsers(),
    name = (id: string) =>
      users.find((user) => user.id === id)?.displayName ?? "—";
  return (
    <div>
      <p className="eyebrow">La sala giochi</p>
      <h1 className="serif mt-1 text-3xl font-bold">Игровая аналитика</h1>
      <p className="mt-2 text-sm text-[#6f7a72]">
        Результаты завершённых раундов неизменяемы. Поиск работает по Round ID.
      </p>
      <form className="mt-5 flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q}
          className="input"
          placeholder="Round ID"
        />
        <button className="btn-secondary">Найти</button>
      </form>
      <GameSection
        title="Sweet Lemonza"
        state={lemonza}
        settings={<AdminLemonzaSettings initial={lemonza.settings} />}
        name={name}
      />
      <GameSection
        title="Casa degli Sposi"
        state={dogs}
        settings={<AdminDogHouseSettings initial={dogs.settings} />}
        name={name}
      />
    </div>
  );
}
function GameSection({
  title,
  state,
  settings,
  name,
}: {
  title: string;
  state: {
    analytics: {
      rounds: number;
      totalStake: number;
      totalWin: number;
      actualRtp: number;
      bonusFrequency: number;
      biggestWin: number;
    };
    rounds: Array<{
      id: string;
      userId: string;
      mode: string;
      chargedAmount: number;
      totalWin: number;
      bonusTriggered: boolean;
      mathVersion: string;
    }>;
  };
  settings: React.ReactNode;
  name: (id: string) => string;
}) {
  return (
    <section className="mt-8">
      <h2 className="serif text-2xl font-bold">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ["Раунды", state.analytics.rounds],
          ["Оборот", formatLira(state.analytics.totalStake)],
          ["Выигрыши", formatLira(state.analytics.totalWin)],
          ["RTP", `${(state.analytics.actualRtp * 100).toFixed(2)}%`],
          ["Бонус", `${(state.analytics.bonusFrequency * 100).toFixed(2)}%`],
          ["Рекорд", formatLira(state.analytics.biggestWin)],
        ].map(([label, value]) => (
          <div className="card p-3" key={label}>
            <span className="text-xs text-[#788078]">{label}</span>
            <strong className="serif block text-xl">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-5 xl:grid-cols-[20rem_1fr]">
        {settings}
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-xs">
            <thead className="bg-[#174b38] text-white/70">
              <tr>
                <th className="p-3">Round</th>
                <th className="p-3">Гость</th>
                <th className="p-3">Стоимость</th>
                <th className="p-3">Выигрыш</th>
                <th className="p-3">Бонус</th>
                <th className="p-3">Math</th>
              </tr>
            </thead>
            <tbody>
              {state.rounds.map((round) => (
                <tr key={round.id} className="border-b border-[#174b38]/8">
                  <td className="max-w-40 truncate p-3 font-mono">
                    {round.id}
                  </td>
                  <td className="p-3 font-bold">{name(round.userId)}</td>
                  <td className="p-3">{formatLira(round.chargedAmount)}</td>
                  <td className="p-3 font-bold">
                    {formatLira(round.totalWin)}
                  </td>
                  <td className="p-3">{round.bonusTriggered ? "Да" : "Нет"}</td>
                  <td className="p-3">{round.mathVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!state.rounds.length && (
            <p className="p-8 text-center text-sm">Раундов пока нет.</p>
          )}
        </div>
      </div>
    </section>
  );
}
