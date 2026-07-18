import { NextResponse } from "next/server";
import { createUser } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try {
    const body = await request.json();
    return NextResponse.json(createUser(body), { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка" }, { status: 400 }); }
}
