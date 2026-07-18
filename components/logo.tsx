import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="На главную">
      <span className="grid size-10 place-items-center rounded-full border border-[#d8ac49]/40 bg-[#f8d75f] text-xl shadow-sm">🍋</span>
      {!compact && <span><span className="serif block text-[1.15rem] font-bold leading-none text-[#174b38]">La Scommessa</span><span className="mt-1 block text-[.55rem] font-bold uppercase tracking-[.22em] text-[#c08c32]">d’amore</span></span>}
    </Link>
  );
}
