import { NextResponse } from "next/server";
import {
  getSweetLemonzaAdminState,
  updateSweetLemonzaSettings,
} from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  return NextResponse.json(
    getSweetLemonzaAdminState(
      new URL(request.url).searchParams.get("q") ?? undefined,
    ),
  );
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN")
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try {
    return NextResponse.json(updateSweetLemonzaSettings(await request.json()));
  } catch {
    return NextResponse.json(
      { error: "Проверьте список ставок" },
      { status: 400 },
    );
  }
}
