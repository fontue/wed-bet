import { DuelArena } from "@/components/duel-arena";
import { getDuelState } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DuelsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "USER") redirect("/admin/duels");
  return (
    <div className="page-shell">
      <DuelArena
        currentUser={user}
        initialBalance={user.balance}
        initialState={getDuelState(user.id)}
      />
    </div>
  );
}
