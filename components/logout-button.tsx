"use client";
import { useRouter } from "next/navigation";
export function LogoutButton() { const router = useRouter(); return <button className="btn-secondary w-full" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); navigator.serviceWorker?.controller?.postMessage("CLEAR_PRIVATE_CACHE"); router.replace("/login"); router.refresh(); }}>Выйти с этого устройства</button>; }
