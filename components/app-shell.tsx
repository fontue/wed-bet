import Link from "next/link";
import type { User } from "@/domain/models";
import { Logo } from "./logo";
import { PwaProvider } from "./pwa-provider";
import { LeaderboardPopup } from "./leaderboard-popup";
import { BalanceBadge } from "./balance-badge";
import { BottomNav } from "./bottom-nav";

type Leader = User & { profit: number; wins: number };
export function AppShell({
  user,
  leaders,
  children,
}: {
  user: User;
  leaders: Leader[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <PwaProvider />
      <header className="sticky top-0 z-40 border-b border-[#174b38]/10 bg-[#f7f1e3]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.65rem] w-full max-w-[76rem] items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden rounded-full border border-[#174b38]/15 px-3 py-2 text-xs font-bold text-[#174b38] sm:block"
              >
                Админка
              </Link>
            )}
            <LeaderboardPopup leaders={leaders} />
            <BalanceBadge initialBalance={user.balance} />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
