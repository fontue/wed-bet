import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentUser } from "@/lib/auth";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const user = await currentUser(); if (!user) redirect("/login"); if (user.role !== "ADMIN") redirect("/"); return <AdminShell user={user}>{children}</AdminShell>; }
