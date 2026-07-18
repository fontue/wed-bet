import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { currentUser } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}>{children}</AppShell>;
}
