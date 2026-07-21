import { redirect } from "next/navigation";
import { DogHouseGame } from "@/components/slots/dog-house-game";
import { getDogHouseState } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export default async function CasaDegliSposiPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "USER") redirect("/admin/slots");
  return <DogHouseGame initialState={getDogHouseState(user.id)} />;
}
