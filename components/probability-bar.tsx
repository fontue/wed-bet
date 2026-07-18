import type { MarketOutcomeView } from "@/domain/market";

const colors = ["#174b38", "#d2a244", "#8da373", "#d47848", "#497966", "#e5c76e"];

export function ProbabilityBar({ outcomes, compact = false }: { outcomes: MarketOutcomeView[]; compact?: boolean }) {
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-[#e6decd] ${compact ? "h-1.5" : "h-2.5"}`} aria-label="Распределение вероятностей">
      {outcomes.map((outcome, index) => <span key={outcome.id} style={{ width: `${outcome.probabilityBps / 100}%`, backgroundColor: colors[index % colors.length] }} title={`${outcome.title}: ${outcome.probabilityBps / 100}%`} />)}
    </div>
  );
}
