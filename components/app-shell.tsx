import Link from "next/link";
import type { User } from "@/domain/models";
import { Logo } from "./logo";
import { PwaProvider } from "./pwa-provider";
import { LeaderboardPopup } from "./leaderboard-popup";
import { BalanceBadge } from "./balance-badge";

const nav = [
  { href: "/", label: "События", icon: "⌂" },
  { href: "/bets", label: "Ставки", icon: "◫" },
  { href: "/bonuses", label: "Бонусы", icon: "✦" },
  { href: "/slots", label: "Слоты", icon: "◉" },
  { href: "/duels", label: "Дуэли", icon: "⚔" },
  { href: "/profile", label: "Профиль", icon: "●" },
];

type Leader = User & { profit: number; wins: number };
export function AppShell({ user, leaders, children }: { user: User; leaders: Leader[]; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PwaProvider />
      <header className="sticky top-0 z-40 border-b border-[#174b38]/10 bg-[#f7f1e3]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.65rem] w-full max-w-[76rem] items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {user.role === "ADMIN" && <Link href="/admin" className="hidden rounded-full border border-[#174b38]/15 px-3 py-2 text-xs font-bold text-[#174b38] sm:block">Админка</Link>}
            <LeaderboardPopup leaders={leaders} />
            <BalanceBadge initialBalance={user.balance} />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#174b38]/10 bg-[#fffdf8]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:left-1/2 md:mb-4 md:max-w-xl md:-translate-x-1/2 md:rounded-full md:border md:shadow-xl">
        <div className="mx-auto grid h-[4.4rem] max-w-2xl grid-cols-6">
          {nav.map((item) => <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-[.62rem] font-bold text-[#587064] transition hover:text-[#174b38]"><span className="text-xl leading-none">{item.icon}</span>{item.label}</Link>)}
        </div>
      </nav>
    </div>
  );
}
