import { NextResponse } from "next/server";
import { getSweetLemonzaState } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "USER")
    return NextResponse.json(
      { error: "Требуется вход гостя" },
      { status: 401 },
    );
  return NextResponse.json(getSweetLemonzaState(user.id), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
