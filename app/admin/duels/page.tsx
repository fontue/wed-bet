import { AdminDuelCancel } from "@/components/admin-duel-cancel";
import { DUEL_GAME_META } from "@/domain/duels";
import { formatLira } from "@/domain/market";
import { listAllDuels, listUsers } from "@/infrastructure/mock/store";

const statusLabel = { PENDING: "Ожидает", RESOLVED: "Рассчитана", DECLINED: "Отклонена", CANCELLED: "Отменена", EXPIRED: "Истекла" };

export default function AdminDuelsPage() {
  const duels = listAllDuels();
  const users = listUsers();
  const name = (id?: string) => users.find((user) => user.id === id)?.displayName ?? "—";
  return <div><p className="eyebrow">Sfide</p><h1 className="serif mt-1 text-3xl font-bold">Дуэли гостей</h1><p className="mt-2 text-sm text-[#6f7a72]">Серверные результаты нельзя изменить. Ожидающую дуэль можно отменить с возвратом.</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-3">{[
      ["Всего", duels.length], ["Ожидают", duels.filter((duel) => duel.status === "PENDING").length], ["Оборот", formatLira(duels.filter((duel) => duel.status === "RESOLVED").reduce((sum, duel) => sum + duel.pot, 0))],
    ].map(([label, value]) => <div className="card p-4" key={label}><span className="text-xs font-bold text-[#788078]">{label}</span><strong className="serif mt-1 block text-2xl">{value}</strong></div>)}</div>
    <div className="card mt-5 overflow-x-auto"><table className="w-full min-w-[50rem] text-left text-sm"><thead className="bg-[#174b38] text-[.65rem] uppercase tracking-wider text-white/65"><tr><th className="p-3">Игра</th><th className="p-3">Инициатор</th><th className="p-3">Соперник</th><th className="p-3">Банк</th><th className="p-3">Победитель</th><th className="p-3">Статус</th><th className="p-3" /></tr></thead><tbody>{duels.map((duel) => <tr key={duel.id} className="border-b border-[#174b38]/8"><td className="p-3 font-bold">{DUEL_GAME_META[duel.game].emoji} {DUEL_GAME_META[duel.game].title}</td><td className="p-3">{name(duel.challengerId)}</td><td className="p-3">{name(duel.opponentId)}</td><td className="p-3 font-bold">{formatLira(duel.pot)}</td><td className="p-3">{name(duel.winnerId)}</td><td className="p-3"><span className="rounded-full bg-[#174b38]/8 px-2 py-1 text-[.6rem] font-extrabold uppercase">{statusLabel[duel.status]}</span></td><td className="p-3">{duel.status === "PENDING" && <AdminDuelCancel duelId={duel.id} />}</td></tr>)}</tbody></table>{!duels.length && <div className="p-8 text-center text-sm text-[#7b827c]">Дуэлей пока не было.</div>}</div>
  </div>;
}
