import { NextResponse } from "next/server";
import { updateUserAdmin } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try { const { id } = await params; return NextResponse.json(updateUserAdmin(id, await request.json())); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка" }, { status: 400 }); }
}
