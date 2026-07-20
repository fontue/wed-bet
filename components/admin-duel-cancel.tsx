"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientRequestId } from "@/lib/client-id";

export function AdminDuelCancel({ duelId }: { duelId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function cancel() {
    if (!window.confirm("Отменить ожидающую дуэль и вернуть инициатору 200 лир?")) return;
    setBusy(true);
    const response = await fetch(`/api/admin/duels/${duelId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "cancel", idempotencyKey: createClientRequestId() }) });
    setBusy(false);
    if (!response.ok) { const body = await response.json(); window.alert(body.error); return; }
    router.refresh();
  }
  return <button className="rounded-lg border border-[#a84735]/20 px-2.5 py-1.5 text-[.65rem] font-extrabold text-[#9b4636]" disabled={busy} onClick={() => void cancel()}>{busy ? "Отменяем…" : "Отменить"}</button>;
}
