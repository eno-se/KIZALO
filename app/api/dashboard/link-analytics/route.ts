import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJstDateString } from "@/lib/jst";

const JST = 9 * 60 * 60 * 1000;

function addDays(dateStr: string, n: number): string {
  const [yr, mo, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, day + n)).toISOString().slice(0, 10);
}

type LinkEntry = { linkId: string; label: string; platform: string; count: number };

function toEntries(rows: { linkId: string; label: string; platform: string; _count: { id: number } }[]): LinkEntry[] {
  return rows
    .map((r) => ({ linkId: r.linkId, label: r.label, platform: r.platform, count: r._count.id }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { creatorProfile: true },
  });
  if (!user?.creatorProfile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const profile = user.creatorProfile;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  const todayStr = getJstDateString();
  const jstNow = Date.now() + JST;

  if (period === "daily") {
    const date = searchParams.get("date") || todayStr;
    const prevDate = addDays(date, -1);

    const [rows, prevRows] = await Promise.all([
      db.linkClick.groupBy({
        by: ["linkId", "label", "platform"],
        where: { creatorId: profile.id, date },
        _count: { id: true },
      }),
      db.linkClick.groupBy({
        by: ["linkId", "label", "platform"],
        where: { creatorId: profile.id, date: prevDate },
        _count: { id: true },
      }),
    ]);

    const links = toEntries(rows);
    const total = links.reduce((s, l) => s + l.count, 0);
    const prevTotal = prevRows.reduce((s, r) => s + r._count.id, 0);
    return NextResponse.json({ links, total, prevTotal });
  }

  if (period === "weekly") {
    const weekStart = searchParams.get("weekStart")!;
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const prevWeekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i - 7));

    const [rows, prevRows] = await Promise.all([
      db.linkClick.groupBy({
        by: ["linkId", "label", "platform"],
        where: { creatorId: profile.id, date: { in: weekDates } },
        _count: { id: true },
      }),
      db.linkClick.groupBy({
        by: ["linkId", "label", "platform"],
        where: { creatorId: profile.id, date: { in: prevWeekDates } },
        _count: { id: true },
      }),
    ]);

    const links = toEntries(rows);
    const total = links.reduce((s, l) => s + l.count, 0);
    const prevTotal = prevRows.reduce((s, r) => s + r._count.id, 0);
    return NextResponse.json({ links, total, prevTotal });
  }

  if (period === "monthly") {
    const month = searchParams.get("month")!;
    const [yr, mo] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(yr, mo, 0)).getUTCDate();

    const prevAbs = yr * 12 + (mo - 1) - 1;
    const prevYr = Math.floor(prevAbs / 12);
    const prevMo = prevAbs % 12 + 1;
    const prevMonthStr = `${prevYr}-${String(prevMo).padStart(2, "0")}`;
    const prevDays = new Date(Date.UTC(prevYr, prevMo, 0)).getUTCDate();

    const [rows, prevRows] = await Promise.all([
      db.linkClick.groupBy({
        by: ["linkId", "label", "platform"],
        where: { creatorId: profile.id, date: { gte: `${month}-01`, lte: `${month}-${String(daysInMonth).padStart(2, "0")}` } },
        _count: { id: true },
      }),
      db.linkClick.groupBy({
        by: ["linkId", "label", "platform"],
        where: { creatorId: profile.id, date: { gte: `${prevMonthStr}-01`, lte: `${prevMonthStr}-${String(prevDays).padStart(2, "0")}` } },
        _count: { id: true },
      }),
    ]);

    const links = toEntries(rows);
    const total = links.reduce((s, l) => s + l.count, 0);
    const prevTotal = prevRows.reduce((s, r) => s + r._count.id, 0);
    return NextResponse.json({ links, total, prevTotal });
  }

  if (period === "yearly") {
    const year = parseInt(searchParams.get("year")!);
    const [rows, prevRows] = await Promise.all([
      db.linkClick.groupBy({
        by: ["linkId", "label", "platform"],
        where: { creatorId: profile.id, date: { gte: `${year}-01-01`, lte: `${year}-12-31` } },
        _count: { id: true },
      }),
      db.linkClick.groupBy({
        by: ["linkId", "label", "platform"],
        where: { creatorId: profile.id, date: { gte: `${year - 1}-01-01`, lte: `${year - 1}-12-31` } },
        _count: { id: true },
      }),
    ]);

    const links = toEntries(rows);
    const total = links.reduce((s, l) => s + l.count, 0);
    const prevTotal = prevRows.reduce((s, r) => s + r._count.id, 0);
    return NextResponse.json({ links, total, prevTotal });
  }

  return NextResponse.json({ error: "Invalid period" }, { status: 400 });
}
