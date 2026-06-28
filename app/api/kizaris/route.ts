import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const TAKE = 30;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const slug = sp.get("slug");
  const date = sp.get("date");
  const tab = sp.get("tab") ?? "fastest";
  const skip = parseInt(sp.get("skip") ?? "0");

  if (!slug || !date) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    select: { id: true, isPublic: true },
  });
  if (!creator || !creator.isPublic) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const session = await auth();
  const myUserId = session?.user.id ?? null;

  if (tab === "fastest") {
    const rows = await db.kizari.findMany({
      where: { creatorId: creator.id, date },
      include: { fan: { select: { id: true, displayName: true, name: true, creatorProfile: { select: { iconUrl: true } } } } },
      orderBy: { createdAt: "asc" },
      skip,
      take: TAKE + 1,
    });

    const hasMore = rows.length > TAKE;
    const items = rows.slice(0, TAKE).map((k, i) => ({
      id: k.id,
      rank: skip + i + 1,
      fanId: k.fanId,
      fanName: k.fan.displayName ?? k.fan.name ?? "名無し",
      fanHandle: k.fan.displayName ? (k.fan.name ?? null) : null,
      fanImage: k.fan.creatorProfile?.iconUrl ?? null,
      createdAt: k.createdAt.toISOString(),
    }));

    return NextResponse.json({ items, hasMore, myUserId });
  } else {
    // streak / most: get all fan IDs who kizared on this date, then paginate FanFollow
    const kizariFanIds = await db.kizari.findMany({
      where: { creatorId: creator.id, date },
      select: { fanId: true },
    });
    const fanIds = kizariFanIds.map((k) => k.fanId);

    if (fanIds.length === 0) {
      return NextResponse.json({ items: [], hasMore: false, myUserId });
    }

    const orderBy = tab === "most"
      ? [{ totalKizari: "desc" as const }, { id: "asc" as const }]
      : [{ streakDays: "desc" as const }, { id: "asc" as const }];

    const rows = await db.fanFollow.findMany({
      where: { creatorId: creator.id, fanId: { in: fanIds } },
      orderBy,
      include: { fan: { select: { id: true, displayName: true, name: true, creatorProfile: { select: { iconUrl: true } } } } },
      skip,
      take: TAKE + 1,
    });

    const hasMore = rows.length > TAKE;
    const items = rows.slice(0, TAKE).map((f, i) => ({
      id: f.id,
      rank: skip + i + 1,
      fanId: f.fanId,
      fanName: f.fan.displayName ?? f.fan.name ?? "名無し",
      fanHandle: f.fan.displayName ? (f.fan.name ?? null) : null,
      fanImage: f.fan.creatorProfile?.iconUrl ?? null,
      streakDays: f.streakDays,
      maxStreakDays: f.maxStreakDays,
      totalKizari: f.totalKizari,
    }));

    return NextResponse.json({ items, hasMore, myUserId });
  }
}
