import { notFound, redirect } from "next/navigation";
import { DogHouseAnimationLab } from "@/components/slots/dog-house/components/animation-lab";
import { currentUser } from "@/lib/auth";
export default async function CasaDegliSposiAnimationLabPage(){if(process.env.NODE_ENV==="production"&&process.env.E2E_TEST!=="1")notFound();const user=await currentUser();if(!user)redirect("/login");if(user.role!=="ADMIN")redirect("/");return <DogHouseAnimationLab/>;}
