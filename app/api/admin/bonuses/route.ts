import { NextResponse } from "next/server";
import { updateBonusSettings } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";
export async function PUT(request: Request) { const admin = await currentUser(); if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 }); try { return NextResponse.json(updateBonusSettings(await request.json())); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка" }, { status: 400 }); } }
