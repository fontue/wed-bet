import { AdminUserTools } from "@/components/admin-user-tools";
import { NewUserForm } from "@/components/new-user-form";
import { formatLira } from "@/domain/market";
import { listUsers } from "@/infrastructure/mock/store";
export default function AdminUsersPage() {
  const users = listUsers();
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Gli ospiti</p>
          <h1 className="serif mt-1 text-3xl font-bold">Гости и доступ</h1>
        </div>
        <NewUserForm />
      </div>
      <div className="card mt-6 overflow-hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="grid gap-3 border-b border-[#174b38]/8 p-4 last:border-0 lg:grid-cols-[1fr_7rem_7rem_18rem] lg:items-center"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#174b38] text-xs font-bold text-white">
                {user.avatar}
              </span>
              <div>
                <strong className="text-sm">{user.displayName}</strong>
                <small className="block text-[#7d857e]">
                  {user.loginCode} ·{" "}
                  {user.role === "ADMIN"
                    ? "администратор"
                    : `стол ${user.tableNumber ?? "—"}`}
                </small>
              </div>
            </div>
            <strong className="text-sm">{formatLira(user.balance)}</strong>
            <span
              className={`w-fit rounded-full px-2 py-1 text-[.6rem] font-extrabold uppercase ${user.status === "ACTIVE" ? "bg-[#3f805e]/10 text-[#2e6b4b]" : "bg-[#a84735]/10 text-[#9a4635]"}`}
            >
              {user.status === "ACTIVE" ? "активен" : "заблокирован"}
            </span>
            <AdminUserTools user={user} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-secondary text-xs">
          Массовое создание из CSV
        </button>
        <button className="btn-secondary text-xs" onClick={undefined}>
          Экспорт карточек для печати
        </button>
      </div>
    </div>
  );
}
