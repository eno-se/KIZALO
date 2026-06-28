import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function pad(n: number) { return String(n).padStart(2, "0"); }
function addDays(dateStr: string, n: number): string {
  const [yr, mo, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, day + n)).toISOString().slice(0, 10);
}

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
  const period = searchParams.get("period");
  const skip = parseInt(searchParams.get("skip") ?? "0");
  const take = 10;

  let dateWhere: { in: string[] } | { gte: string; lte: string };

  if (period === "weekly") {
    const weekStart = searchParams.get("weekStart")!;
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    dateWhere = { in: weekDates };
  } else if (period === "monthly") {
    const month = searchParams.get("month")!;
    const [yr, mo] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
    dateWhere = { gte: `${month}-01`, lte: `${month}-${pad(daysInMonth)}` };
  } else if (period === "yearly") {
    const year = searchParams.get("year")!;
    dateWhere = { gte: `${year}-01-01`, lte: `${year}-12-31` };
  } else {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  // 期間内の刻り数をfanId別に集計（全件取得してメモリでソート）
  const groups = await db.kizari.groupBy({
    by: ["fanId"],
    where: { creatorId, date: dateWhere },
    _count: { id: true },
  });

  groups.sort((a, b) => b._count.id - a._count.id);
  const total = groups.length;
  const hasMore = skip + take < total;
  const page = groups.slice(skip, skip + take);

  if (page.length === 0) {
    return NextResponse.json({ fans: [], hasMore: false, total });
  }

  const fanIds = page.map((g) => g.fanId);
  const countMap = Object.fromEntries(page.map((g) => [g.fanId, g._count.id]));

  const [users, follows, lastDates] = await Promise.all([
    db.user.findMany({
      where: { id: { in: fanIds } },
      select: {
        id: true,
        displayName: true,
        name: true,
        creatorProfile: { select: { iconUrl: true } },
      },
    }),
    db.fanFollow.findMany({
      where: { fanId: { in: fanIds }, creatorId },
      select: { fanId: true, streakDays: true },
    }),
    db.kizari.groupBy({
      by: ["fanId"],
      where: { fanId: { in: fanIds }, creatorId },
      _max: { date: true },
    }),
  ]);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const followMap = Object.fromEntries(follows.map((f) => [f.fanId, f.streakDays]));
  const lastDateMap = Object.fromEntries(lastDates.map((r) => [r.fanId, r._max.date]));

  const fans = page.map((g) => {
    const u = userMap[g.fanId];
    return {
      id: g.fanId,
      name: u?.displayName ?? u?.name ?? "ファン",
      iconUrl: u?.creatorProfile?.iconUrl ?? null,
      periodCount: countMap[g.fanId],
      streakDays: followMap[g.fanId] ?? 0,
      lastKizariDate: lastDateMap[g.fanId] ?? null,
    };
  });

  return NextResponse.json({ fans, hasMore, total });
}
