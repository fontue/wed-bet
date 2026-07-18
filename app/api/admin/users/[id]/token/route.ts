import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { issueLoginToken } from "@/infrastructure/mock/store";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentUser();
  if (!admin || admin.role !== "ADMIN") return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try {
    const { id } = await params;
    const token = issueLoginToken(id);
    const origin = new URL(request.url).origin;
    const url = `${origin}/login?token=${token}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 420, margin: 2, color: { dark: "#174b38", light: "#fffdf7" }, errorCorrectionLevel: "M" });
    return NextResponse.json({ url, qrDataUrl });
  } catch { return NextResponse.json({ error: "Не удалось выпустить QR" }, { status: 400 }); }
}
