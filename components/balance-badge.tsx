"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatLira } from "@/domain/market";

export function BalanceBadge({ initialBalance }: { initialBalance: number }) {
  const [balance, setBalance] = useState(initialBalance);
  useEffect(() => {
    const update = (event: Event) => setBalance((event as CustomEvent<number>).detail);
    window.addEventListener("wedbet:balance", update);
    return () => window.removeEventListener("wedbet:balance", update);
  }, []);
  return <Link href="/profile" className="rounded-full bg-white px-3.5 py-2 text-sm font-extrabold text-[#174b38] shadow-sm"><span className="mr-1.5 text-[#c89537]">₤</span>{formatLira(balance).replace(" ₤", "")}</Link>;
}
