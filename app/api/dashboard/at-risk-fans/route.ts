import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJstDateString, getJstYesterdayString } from "@/lib/jst";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { creatorProfile: { select: { id: true } } },
  });
  if (!user?.creatorProfile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const creatorId = user.creatorProfile.id;
  const { searchParams } = new URL(req.url);
  const skip = parseInt(searchParams.get("skip") ?? "0");
  const take = 10;

  const todayStr = getJstDateString();
  const yesterdayStr = getJstYesterdayString();

  // 昨日 JST 内に lastKizariAt がある FanFollow を streakDays 降順で取得
  const [candidates, todayFanIds] = await Promise.all([
    db.fanFollow.findMany({
      where: {
        creatorId,
        streakDays: { gte: 1 },
        lastKizariAt: {
          gte: new Date(yesterdayStr + "T00:00:00+09:00"),
          lt: new Date(todayStr + "T00:00:00+09:00"),
        },
      },
      orderBy: { streakDays: "desc" },
      include: {
        fan: {
          select: {
            id: true,
            displayName: true,
            name: true,
            creatorProfile: { select: { iconUrl: true } },
          },
        },
      },
    }),
    db.kizari.findMany({
      where: { creatorId, date: todayStr },
      select: { fanId: true },
    }),
  ]);

  const todaySet = new Set(todayFanIds.map((k) => k.fanId));
  const atRisk = candidates.filter((f) => !todaySet.has(f.fanId));

  const total = atRisk.length;
  const page = atRisk.slice(skip, skip + take);
  const hasMore = skip + take < total;

  const fans = page.map((f) => ({
    id: f.fanId,
    name: f.fan.displayName ?? f.fan.name ?? "ファン",
    iconUrl: f.fan.creatorProfile?.iconUrl ?? null,
    streakDays: f.streakDays,
  }));

  return NextResponse.json({ fans, hasMore, total });
}
