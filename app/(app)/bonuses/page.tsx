import { BonusWheel } from "@/components/bonus-wheel";
import { getBonusState } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export default async function BonusesPage() {
  const user = await currentUser();
  if (!user) return null;
  const state = getBonusState(user.id);
  return (
    <div className="page-shell">
      <BonusWheel
        definitions={state.definitions}
        initialBonuses={state.bonuses}
        initialSpins={state.spins}
        initialNextSpinAt={state.nextSpinAt}
        initialServerTime={state.serverTime}
      />
    </div>
  );
}
