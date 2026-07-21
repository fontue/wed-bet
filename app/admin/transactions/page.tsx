import { formatLira } from "@/domain/market";
import { listTransactions, listUsers } from "@/infrastructure/mock/store";
export default function AdminTransactionsPage() {
  const transactions = listTransactions();
  const users = listUsers();
  return (
    <div>
      <p className="eyebrow">Libro mastro</p>
      <h1 className="serif mt-1 text-3xl font-bold">Журнал операций</h1>
      <p className="mt-2 text-sm text-[#6f7a72]">
        Баланс нельзя изменить в обход этого журнала.
      </p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="bg-[#174b38] text-[.65rem] uppercase tracking-wider text-white/65">
            <tr>
              <th className="p-3">Время</th>
              <th className="p-3">Гость</th>
              <th className="p-3">Тип</th>
              <th className="p-3">Причина</th>
              <th className="p-3">Изменение</th>
              <th className="p-3">Баланс</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id} className="border-b border-[#174b38]/8">
                <td className="whitespace-nowrap p-3 text-xs text-[#778078]">
                  {new Date(item.createdAt).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-3 font-bold">
                  {users.find((u) => u.id === item.userId)?.displayName ?? "—"}
                </td>
                <td className="p-3 text-xs">{item.type}</td>
                <td className="max-w-72 truncate p-3">{item.reason}</td>
                <td
                  className={`p-3 font-bold ${item.amount >= 0 ? "text-[#2f7251]" : "text-[#a84735]"}`}
                >
                  {item.amount > 0 ? "+" : ""}
                  {formatLira(item.amount)}
                </td>
                <td className="p-3">{formatLira(item.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
