"use client";

import { useEffect, useState } from "react";
import { flushBetOutbox } from "@/lib/outbox";

export function PwaProvider() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setOnline(navigator.onLine));
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    const sync = async () => {
      setOnline(true); setSyncing(true);
      await flushBetOutbox();
      setSyncing(false);
      window.dispatchEvent(new CustomEvent("wedbet:sync-complete"));
    };
    const offline = () => setOnline(false);
    window.addEventListener("online", sync);
    window.addEventListener("offline", offline);
    if (navigator.onLine) void sync();
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", offline); };
  }, []);

  if (online && !syncing) return null;
  return <div className={`fixed inset-x-0 top-0 z-[100] px-3 py-2 text-center text-xs font-bold text-white ${online ? "bg-[#c38b2f]" : "bg-[#9b4938]"}`}>{online ? "Соединение вернулось · отправляем очередь…" : "Offline · показываем последние сохранённые данные"}</div>;
}
