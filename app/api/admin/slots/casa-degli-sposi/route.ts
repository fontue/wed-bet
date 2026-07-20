import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getDogHouseAdminState, updateDogHouseSettings } from "@/infrastructure/mock/store";
export async function GET(request:Request){const user=await currentUser();if(!user||user.role!=="ADMIN")return NextResponse.json({error:"Нет доступа"},{status:403});return NextResponse.json(getDogHouseAdminState(new URL(request.url).searchParams.get("q")??undefined));}
export async function PUT(request:Request){const user=await currentUser();if(!user||user.role!=="ADMIN")return NextResponse.json({error:"Нет доступа"},{status:403});try{return NextResponse.json(updateDogHouseSettings(await request.json()));}catch{return NextResponse.json({error:"Проверьте список ставок"},{status:400});}}
