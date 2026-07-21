import Link from "next/link";
import type { User } from "@/domain/models";
import { Logo } from "./logo";

const links = [
  { href: "/admin", label: "Обзор", icon: "◫" },
  { href: "/admin/events", label: "События", icon: "◆" },
  { href: "/admin/users", label: "Гости", icon: "●" },
  { href: "/admin/bets", label: "Ставки", icon: "⌁" },
  { href: "/admin/duels", label: "Дуэли", icon: "⚔" },
  { href: "/admin/slots", label: "Sweet Lemonza", icon: "◉" },
  { href: "/admin/transactions", label: "Операции", icon: "₤" },
  { href: "/admin/bonuses", label: "Бонусы", icon: "✦" },
  { href: "/admin/news", label: "Инсайды", icon: "✎" },
];
export function AdminShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f3eddf]">
      <header className="sticky top-0 z-40 border-b border-[#174b38]/10 bg-[#fffdf7]/95 backdrop-blur">
        <div className="mx-auto flex h-[4.6rem] max-w-[90rem] items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-secondary !min-h-9 text-xs">
              Приложение ↗
            </Link>
            <span className="hidden text-xs font-bold text-[#6f7b72] sm:block">
              {user.displayName}
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[90rem] md:grid-cols-[13rem_1fr]">
        <aside className="scrollbar-none hidden h-[calc(100vh-4.6rem)] overflow-y-auto border-r border-[#174b38]/10 bg-[#fffdf7]/55 p-3 md:block">
          <p className="px-3 pb-2 pt-3 text-[.6rem] font-extrabold uppercase tracking-[.18em] text-[#a07831]">
            Кабинет крупье
          </p>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#536a5f] hover:bg-white hover:text-[#174b38]"
            >
              <span className="w-5 text-center">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </aside>
        <main className="min-w-0 p-4 pb-24 md:p-7">{children}</main>
      </div>
      <nav className="scrollbar-none fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto border-t border-[#174b38]/10 bg-[#fffdf7]/95 p-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="min-w-20 rounded-xl px-2 py-2 text-center text-[.65rem] font-bold text-[#536a5f]"
          >
            <span className="block text-lg">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
