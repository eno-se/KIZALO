import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getJstDateString } from "@/lib/jst";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { creatorId, linkId, label, platform } = body ?? {};
  if (!creatorId || !linkId || !label || !platform) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await db.linkClick.create({
    data: { creatorId, linkId, label, platform, date: getJstDateString() },
  });

  return NextResponse.json({ ok: true });
}
