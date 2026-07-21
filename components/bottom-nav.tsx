"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavIconName =
  "events" | "bets" | "bonuses" | "casino" | "duels" | "profile";

const nav: Array<{ href: string; label: string; icon: NavIconName }> = [
  { href: "/", label: "События", icon: "events" },
  { href: "/bets", label: "Ставки", icon: "bets" },
  { href: "/bonuses", label: "Бонусы", icon: "bonuses" },
  { href: "/casino", label: "Казино", icon: "casino" },
  { href: "/duels", label: "Дуэли", icon: "duels" },
  { href: "/profile", label: "Профиль", icon: "profile" },
];

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[1.35rem]">
      {name === "events" && (
        <>
          <path {...common} d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" />
          <path {...common} d="M9 20v-6h6v6" />
          <path
            {...common}
            d="M8.2 7.1c.2-1.8 2.5-2.2 3.8-.5 1.3-1.7 3.6-1.3 3.8.5.2 1.7-1.8 2.8-3.8 4.1-2-1.3-4-2.4-3.8-4.1Z"
          />
        </>
      )}
      {name === "bets" && (
        <>
          <path {...common} d="M5 4h14v16H5z" />
          <path {...common} d="M8 8h8M8 12h5M8 16h3" />
          <path {...common} d="m14.5 16 1.4 1.4 2.6-3" />
        </>
      )}
      {name === "bonuses" && (
        <>
          <path {...common} d="M4 9h16v11H4zM3 6h18v3H3zM12 6v14" />
          <path
            {...common}
            d="M12 6H8.8C6.2 6 5.7 2.5 8.1 2.5c2.2 0 3.9 3.5 3.9 3.5Zm0 0h3.2c2.6 0 3.1-3.5.7-3.5C13.7 2.5 12 6 12 6Z"
          />
        </>
      )}
      {name === "casino" && (
        <>
          <rect {...common} x="4" y="5" width="12" height="15" rx="2" />
          <path {...common} d="m8 11 2-2 2 2-2 2-2-2Z" />
          <path {...common} d="M8 16h4" />
          <path
            {...common}
            d="M16 8.2 19.5 7a1.5 1.5 0 0 1 1.9 1l1.9 7.2a1.5 1.5 0 0 1-1 1.8L16 18.7"
          />
        </>
      )}
      {name === "duels" && (
        <>
          <path {...common} d="m5 4 6 6-2 2-6-6 2-2ZM19 4l-6 6 2 2 6-6-2-2Z" />
          <path
            {...common}
            d="m8 13-3 3m11-3 3 3M3.5 18.5l2 2M20.5 18.5l-2 2"
          />
        </>
      )}
      {name === "profile" && (
        <>
          <circle {...common} cx="12" cy="8" r="4" />
          <path {...common} d="M4.5 20c.7-4 3.2-6 7.5-6s6.8 2 7.5 6" />
        </>
      )}
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#174b38]/10 bg-[#fffdf8]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:left-1/2 md:mb-4 md:max-w-xl md:-translate-x-1/2 md:rounded-full md:border md:shadow-xl"
    >
      <div className="mx-auto grid h-[4.4rem] max-w-2xl grid-cols-6">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.icon === "casino"
                ? pathname.startsWith("/casino") ||
                  pathname.startsWith("/slots")
                : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex flex-col items-center justify-center gap-1 text-[.62rem] font-bold transition ${active ? "text-[#174b38]" : "text-[#718078] hover:text-[#174b38]"}`}
            >
              <span
                className={`grid size-8 place-items-center rounded-xl transition ${active ? "bg-[#f2cf55]/28 shadow-[inset_0_0_0_1px_rgba(192,140,50,.14)]" : "group-hover:bg-[#174b38]/5"}`}
              >
                <NavIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
