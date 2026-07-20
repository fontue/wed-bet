import { redirect } from "next/navigation";
import { SweetLemonzaGame } from "@/components/slots/lemonza-game";
import { getSweetLemonzaState } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export default async function SweetLemonzaPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "USER") redirect("/admin/slots");
  return <SweetLemonzaGame initialState={getSweetLemonzaState(user.id)} />;
}
