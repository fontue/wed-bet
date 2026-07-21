import Link from "next/link";
import { LemonzaCover } from "@/components/slots/lemonza-cover";
import { DogHouseCover } from "@/components/slots/dog-house-cover";
import { formatLira } from "@/domain/market";
import { slotCatalog } from "@/data/slots";

export default function SlotsPage() {
  return (
    <div className="page-shell">
      <p className="eyebrow">Il piccolo casinò</p>
      <h1 className="serif mt-1 text-3xl font-bold">Свадебные слоты</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6e7a71]">
        Оригинальные игры на виртуальные свадебные лиры. Никаких покупок,
        продажи или вывода.
      </p>
      <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {slotCatalog.map((slot) => (
          <article key={slot.id} className="card overflow-hidden">
            <div className="h-60">
              {slot.coverTone === "dogs" ? <DogHouseCover /> : <LemonzaCover />}
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
    </div>
  );
}
