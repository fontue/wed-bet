"use client";

import Link from "next/link";
import { useState } from "react";
import type { User } from "@/domain/models";
import { formatLira } from "@/domain/market";

type Leader = User & { profit: number; wins: number };

export function LeaderboardPopup({ leaders }: { leaders: Leader[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full border border-[#174b38]/10 bg-white text-lg text-[#b5812c] shadow-sm"
        aria-label="Открыть рейтинг"
      >
        ♛
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end bg-[#102c22]/45 backdrop-blur-sm sm:items-start sm:justify-end sm:bg-transparent sm:pt-[4.3rem]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <section className="w-full rounded-t-[1.6rem] border border-[#174b38]/10 bg-[#fffdf7] p-5 shadow-2xl sm:mr-5 sm:w-[23rem] sm:rounded-[1.4rem]">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">La classifica</p>
                <h2 className="serif mt-1 text-2xl font-bold">
                  Лучшие оракулы
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-full bg-[#174b38]/7 text-lg"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-1">
              {leaders.slice(0, 5).map((leader, index) => (
                <div
                  key={leader.id}
                  className="grid grid-cols-[1.7rem_1fr_auto] items-center gap-2 rounded-xl px-2 py-2.5 hover:bg-[#174b38]/[.035]"
                >
                  <strong className="serif text-center text-[#b5812c]">
                    {index + 1}
                  </strong>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-extrabold">
                      {leader.displayName}
                    </span>
                    <small className="text-[#7c847d]">
                      {leader.wins} побед
                    </small>
                  </div>
                  <div className="text-right">
                    <strong
                      className={
                        leader.profit >= 0 ? "text-[#2f7251]" : "text-[#a84735]"
                      }
                    >
                      {leader.profit >= 0 ? "+" : ""}
                      {formatLira(leader.profit)}
                    </strong>
                    <small className="block text-[#8a8e88]">
                      {formatLira(leader.balance)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/leaderboard"
              onClick={() => setOpen(false)}
              className="btn-primary mt-4 w-full"
            >
              Весь рейтинг
            </Link>
          </section>
        </div>
      )}
    </>
  );
}
