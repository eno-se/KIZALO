import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJstDateString } from "@/lib/jst";
import { checkRateLimit } from "@/lib/rate-limit";

const ALLOWED_PLATFORMS = new Set([
  "x", "instagram", "tiktok", "youtube", "twitch", "showroom",
  "17live", "pococha", "note", "threads", "booth", "litlink", "website",
  "bio", "block-image",
]);

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";

  if (!checkRateLimit(`link-click:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const { creatorId, linkId, label, platform } = body ?? {};
  if (!creatorId || !linkId || !label || !platform) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const creator = await db.creatorProfile.findUnique({
    where: { id: creatorId },
    select: { id: true },
  });
  if (!creator) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    await db.linkClick.create({
      data: { creatorId, linkId, label, platform, date: getJstDateString(), ip },
    });
  } catch {
    // ユニーク制約違反 = 同じIPが今日すでにこのリンクをクリック済み → 無視
  }

  return NextResponse.json({ ok: true });
}
