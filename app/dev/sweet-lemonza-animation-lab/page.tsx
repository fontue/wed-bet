import { notFound, redirect } from "next/navigation";
import { SweetLemonzaAnimationLab } from "@/components/slots/sweet-lemonza/components/animation-lab";
import { currentUser } from "@/lib/auth";

export default async function SweetLemonzaAnimationLabPage(){
  if(process.env.NODE_ENV==="production")notFound();
  const user=await currentUser();
  if(!user)redirect("/login");
  if(user.role!=="ADMIN")redirect("/");
  return <SweetLemonzaAnimationLab/>;
}
