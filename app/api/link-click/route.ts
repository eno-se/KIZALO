import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJstDateString } from "@/lib/jst";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { creatorId, linkId, label, platform } = body ?? {};
  if (!creatorId || !linkId || !label || !platform) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";

  try {
    await db.linkClick.create({
      data: { creatorId, linkId, label, platform, date: getJstDateString(), ip },
    });
  } catch {
    // ユニーク制約違反 = 同じIPが今日すでにこのリンクをクリック済み → 無視
  }

  return NextResponse.json({ ok: true });
}
