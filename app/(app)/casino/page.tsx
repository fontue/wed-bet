import Link from "next/link";
import { LemonzaCover } from "@/components/slots/lemonza-cover";
import { DogHouseCover } from "@/components/slots/dog-house-cover";
import { formatLira } from "@/domain/market";
import { slotCatalog } from "@/data/slots";

export default async function CasinoPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string | string[] }>;
}) {
  const requestedGame = (await searchParams).game;
  const section = requestedGame === "cards" ? "cards" : "slots";
  return (
    <div className="page-shell">
      <p className="eyebrow">Il piccolo casinò</p>
      <h1 className="serif mt-1 text-3xl font-bold">Свадебное казино</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6e7a71]">
        Игры только на виртуальные свадебные лиры. Никаких покупок, продажи или
        вывода.
      </p>

      <div className="mt-6 inline-grid grid-cols-2 rounded-2xl border border-[#174b38]/10 bg-white/70 p-1 shadow-sm">
        <Link
          href="/casino?game=slots"
          aria-current={section === "slots" ? "page" : undefined}
          className={`flex min-w-32 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${section === "slots" ? "bg-[#174b38] text-white shadow-sm" : "text-[#65736b] hover:bg-[#174b38]/5"}`}
        >
          <span aria-hidden="true">▦</span>
          Слоты
        </Link>
        <Link
          href="/casino?game=cards"
          aria-current={section === "cards" ? "page" : undefined}
          className={`flex min-w-32 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${section === "cards" ? "bg-[#174b38] text-white shadow-sm" : "text-[#65736b] hover:bg-[#174b38]/5"}`}
        >
          <span aria-hidden="true">♠</span>
          Карты
        </Link>
      </div>

      {section === "slots" ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {slotCatalog.map((slot) => (
            <article key={slot.id} className="card overflow-hidden">
              <div className="h-60">
                {slot.coverTone === "dogs" ? (
                  <DogHouseCover />
                ) : (
                  <LemonzaCover />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-[#f2cf55]/20 px-2 py-1 text-[.62rem] font-extrabold uppercase tracking-wider text-[#987126]">
                      {slot.badge}
                    </span>
                    <h2 className="serif mt-3 text-2xl font-bold">
                      {slot.title}
                    </h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#b17e2c]">
                      {slot.subtitle}
                    </p>
                  </div>
                  <span className="rounded-xl bg-[#174b38]/7 px-3 py-2 text-xs font-bold">
                    от {formatLira(slot.minBet)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#6d7970]">
                  {slot.description}
                </p>
                <Link href={slot.href} className="btn-primary mt-5 w-full">
                  Играть
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="mt-7 grid min-h-72 place-items-center rounded-3xl border border-dashed border-[#174b38]/18 bg-white/45 px-6 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#174b38]/7 text-3xl text-[#174b38]">
              ♠
            </span>
            <h2 className="serif mt-4 text-2xl font-bold text-[#174b38]">
              Карточный зал готовится
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#758078]">
              Здесь появятся карточные игры. Пока раздел пуст.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
