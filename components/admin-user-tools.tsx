"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/domain/models";

export function AdminUserTools({ user }: { user: User }) {
  const router = useRouter();
  const [qr, setQr] = useState<{ url: string; qrDataUrl: string }>();
  const [busy, setBusy] = useState(false);
  async function patch(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setBusy(false);
    router.refresh();
  }
  async function adjust() {
    const rawAmount = window.prompt(
      "Изменение баланса целым числом. Для списания укажите минус:",
    );
    if (!rawAmount) return;
    const amount = Number(rawAmount);
    if (!Number.isInteger(amount) || amount === 0)
      return window.alert("Нужно ненулевое целое число");
    const reason = window.prompt("Причина корректировки (обязательно):");
    if (!reason?.trim()) return;
    await patch("adjust", { amount, reason });
  }
  async function makeQr() {
    setBusy(true);
    const response = await fetch(`/api/admin/users/${user.id}/token`, {
      method: "POST",
    });
    setQr(await response.json());
    setBusy(false);
  }
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <button
          className="rounded-lg border border-[#174b38]/12 px-2 py-1.5 text-[.65rem] font-bold"
          disabled={busy}
          onClick={() => void makeQr()}
        >
          Новый QR
        </button>
        <button
          className="rounded-lg border border-[#174b38]/12 px-2 py-1.5 text-[.65rem] font-bold"
          disabled={busy}
          onClick={() => void adjust()}
        >
          ± Баланс
        </button>
        <button
          className="rounded-lg border border-[#174b38]/12 px-2 py-1.5 text-[.65rem] font-bold"
          disabled={busy}
          onClick={() => void patch("reset-sessions")}
        >
          Сбросить сессии
        </button>
        <button
          className="rounded-lg border border-[#a84735]/15 px-2 py-1.5 text-[.65rem] font-bold text-[#9b4636]"
          disabled={busy}
          onClick={() =>
            void patch(user.status === "ACTIVE" ? "block" : "unblock")
          }
        >
          {user.status === "ACTIVE" ? "Блокировать" : "Разблокировать"}
        </button>
      </div>
      {qr?.qrDataUrl && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-[#102c22]/60 p-4"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setQr(undefined);
          }}
        >
          <section className="card max-w-sm p-6 text-center">
            <p className="eyebrow">Персональная карточка</p>
            <h2 className="serif mt-1 text-2xl font-bold">
              {user.displayName}
            </h2>
            <Image
              src={qr.qrDataUrl}
              alt={`QR-код для ${user.displayName}`}
              width={280}
              height={280}
              unoptimized
              className="mx-auto my-4 rounded-xl"
            />
            <p className="break-all text-[.62rem] text-[#798079]">{qr.url}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="btn-secondary"
                onClick={() => setQr(undefined)}
              >
                Закрыть
              </button>
              <button className="btn-primary" onClick={() => window.print()}>
                Печать
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
