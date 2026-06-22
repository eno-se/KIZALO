import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJstDateString } from "@/lib/jst";

const JST = 9 * 60 * 60 * 1000;

function addDays(dateStr: string, n: number): string {
  const [yr, mo, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, day + n)).toISOString().slice(0, 10);
}

function pad(n: number) { return String(n).padStart(2, "0"); }

async function getLinkRanking(creatorId: string, where: object) {
  const rows = await db.linkClick.groupBy({
    by: ["linkId", "label", "platform"],
    where: { creatorId, ...where },
    _count: { id: true },
  });
  return rows
    .map((r) => ({ linkId: r.linkId, label: r.label, platform: r.platform, count: r._count.id }))
    .sort((a, b) => b.count - a.count);
}

async function getTopFans(fanGroups: { fanId: string; _count: { id: number } }[]) {
  const top = [...fanGroups].sort((a, b) => b._count.id - a._count.id).slice(0, 5);
  if (top.length === 0) return [];
  const users = await db.user.findMany({
    where: { id: { in: top.map((r) => r.fanId) } },
    select: { id: true, displayName: true },
  });
  const nameMap = Object.fromEntries(users.map((u) => [u.id, u.displayName || "ファン"]));
  return top.map((r) => ({ id: r.fanId, name: nameMap[r.fanId] ?? "ファン", count: r._count.id }));
}

function computeTrend(
  currentIds: Set<string>,
  prevIds: Set<string>,
  newFanCount: number,
) {
  const continuingFans = [...currentIds].filter((id) => prevIds.has(id)).length;
  const returningFans = Math.max(0, currentIds.size - continuingFans - newFanCount);
  return { continuingFans, returningFans };
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

  // ---- 日 ----
  if (period === "daily") {
    const date = searchParams.get("date") || todayStr;
    const prevDate = addDays(date, -1);
    const nextDate = addDays(date, 1);

    const [kizaris, prevCount, prevFanGroups, newFanCount, linkRanking] = await Promise.all([
      db.kizari.findMany({
        where: { creatorId: profile.id, date },
        include: { fan: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.kizari.count({ where: { creatorId: profile.id, date: prevDate } }),
      db.kizari.groupBy({ by: ["fanId"], where: { creatorId: profile.id, date: prevDate }, _count: { id: true } }),
      db.fanFollow.count({
        where: {
          creatorId: profile.id,
          createdAt: { gte: new Date(date + "T00:00:00+09:00"), lt: new Date(nextDate + "T00:00:00+09:00") },
        },
      }),
      getLinkRanking(profile.id, { date }),
    ]);

    const hourMap: Record<number, number> = {};
    const fanList = kizaris.map((k) => {
      const h = new Date(k.createdAt.getTime() + JST).getUTCHours();
      hourMap[h] = (hourMap[h] ?? 0) + 1;
      const jstTime = new Date(k.createdAt.getTime() + JST);
      return {
        id: k.fan.id,
        name: k.fan.displayName || "ファン",
        time: `${pad(jstTime.getUTCHours())}:${pad(jstTime.getUTCMinutes())}`,
      };
    });

    const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] ?? 0 }));
    const peakHour = hourlyData.reduce((max, d) => d.count > max.count ? d : max, hourlyData[0]);

    const currentFanIds = new Set(kizaris.map((k) => k.fanId));
    const prevFanIds = new Set(prevFanGroups.map((r) => r.fanId));
    const { continuingFans, returningFans } = computeTrend(currentFanIds, prevFanIds, newFanCount);

    return NextResponse.json({
      hourlyData,
      total: kizaris.length,
      prevTotal: prevCount,
      peakLabel: peakHour.count > 0 ? `${peakHour.hour}時台` : null,
      newFans: newFanCount,
      continuingFans,
      returningFans,
      fanList,
      isToday: date === todayStr,
      linkRanking,
    });
  }

  // ---- 週 ----
  if (period === "weekly") {
    const weekStart = searchParams.get("weekStart")!;
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const prevWeekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i - 7));

    const [kizariGroups, currentFanGroups, prevFanGroups, newFanCount, linkRanking] = await Promise.all([
      db.kizari.groupBy({
        by: ["date"],
        where: { creatorId: profile.id, date: { in: [...weekDates, ...prevWeekDates] } },
        _count: { id: true },
      }),
      db.kizari.groupBy({ by: ["fanId"], where: { creatorId: profile.id, date: { in: weekDates } }, _count: { id: true } }),
      db.kizari.groupBy({ by: ["fanId"], where: { creatorId: profile.id, date: { in: prevWeekDates } }, _count: { id: true } }),
      db.fanFollow.count({
        where: {
          creatorId: profile.id,
          createdAt: { gte: new Date(weekStart + "T00:00:00+09:00"), lt: new Date(addDays(weekStart, 7) + "T00:00:00+09:00") },
        },
      }),
      getLinkRanking(profile.id, { date: { in: weekDates } }),
    ]);

    const map = Object.fromEntries(kizariGroups.map((r) => [r.date, r._count.id]));
    const DAY = ["月", "火", "水", "木", "金", "土", "日"];
    const weekData = Array.from({ length: 7 }, (_, i) => ({ label: DAY[i], count: map[weekDates[i]] ?? 0 }));
    const total = weekData.reduce((s, d) => s + d.count, 0);
    const prevTotal = prevWeekDates.reduce((s, d) => s + (map[d] ?? 0), 0);
    const peak = weekData.reduce((max, d) => d.count > max.count ? d : max, weekData[0]);

    const currentFanIds = new Set(currentFanGroups.map((r) => r.fanId));
    const prevFanIds = new Set(prevFanGroups.map((r) => r.fanId));
    const { continuingFans, returningFans } = computeTrend(currentFanIds, prevFanIds, newFanCount);
    const topFans = await getTopFans(currentFanGroups);

    const dow = new Date(jstNow).getUTCDay();
    const currentWeekMonday = addDays(todayStr, -((dow - 1 + 7) % 7));

    return NextResponse.json({
      weekData, total, prevTotal,
      peakLabel: peak.count > 0 ? peak.label : null,
      isCurrentWeek: weekStart === currentWeekMonday,
      topFans, newFans: newFanCount, continuingFans, returningFans,
      linkRanking,
    });
  }

  // ---- 月 ----
  if (period === "monthly") {
    const month = searchParams.get("month")!;
    const [yr, mo] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
    const firstDayOfWeek = new Date(Date.UTC(yr, mo - 1, 1)).getUTCDay();

    const prevAbs = yr * 12 + (mo - 1) - 1;
    const prevYr = Math.floor(prevAbs / 12);
    const prevMo = prevAbs % 12 + 1;
    const prevMonthStr = `${prevYr}-${pad(prevMo)}`;
    const prevDays = new Date(Date.UTC(prevYr, prevMo, 0)).getUTCDate();

    const nextAbs = yr * 12 + mo;
    const nextMonthStr = `${Math.floor(nextAbs / 12)}-${pad(nextAbs % 12 + 1)}`;

    const curRange = { gte: `${month}-01`, lte: `${month}-${pad(daysInMonth)}` };
    const prevRange = { gte: `${prevMonthStr}-01`, lte: `${prevMonthStr}-${pad(prevDays)}` };

    const [rows, prevRows, currentFanGroups, prevFanGroups, newFanCount, linkRanking] = await Promise.all([
      db.kizari.groupBy({ by: ["date"], where: { creatorId: profile.id, date: curRange }, _count: { id: true } }),
      db.kizari.groupBy({ by: ["date"], where: { creatorId: profile.id, date: prevRange }, _count: { id: true } }),
      db.kizari.groupBy({ by: ["fanId"], where: { creatorId: profile.id, date: curRange }, _count: { id: true } }),
      db.kizari.groupBy({ by: ["fanId"], where: { creatorId: profile.id, date: prevRange }, _count: { id: true } }),
      db.fanFollow.count({
        where: {
          creatorId: profile.id,
          createdAt: { gte: new Date(`${month}-01T00:00:00+09:00`), lt: new Date(`${nextMonthStr}-01T00:00:00+09:00`) },
        },
      }),
      getLinkRanking(profile.id, { date: curRange }),
    ]);

    const dayMap = Object.fromEntries(rows.map((r) => [parseInt(r.date.slice(8)), r._count.id]));
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, count: dayMap[i + 1] ?? 0 }));
    const total = monthDays.reduce((s, d) => s + d.count, 0);
    const prevTotal = prevRows.reduce((s, r) => s + r._count.id, 0);

    const jstDate = new Date(jstNow);
    const currentMonthStr = `${jstDate.getUTCFullYear()}-${pad(jstDate.getUTCMonth() + 1)}`;
    const todayDay = month === currentMonthStr ? jstDate.getUTCDate() : -1;

    const weeklySummary: number[] = [];
    let weekSum = 0;
    for (let i = 0; i < daysInMonth; i++) {
      weekSum += monthDays[i].count;
      if ((i + firstDayOfWeek + 1) % 7 === 0 || i === daysInMonth - 1) { weeklySummary.push(weekSum); weekSum = 0; }
    }

    const peakDay = monthDays.reduce((max, d) => d.count > max.count ? d : max, monthDays[0]);

    const currentFanIds = new Set(currentFanGroups.map((r) => r.fanId));
    const prevFanIds = new Set(prevFanGroups.map((r) => r.fanId));
    const { continuingFans, returningFans } = computeTrend(currentFanIds, prevFanIds, newFanCount);
    const topFans = await getTopFans(currentFanGroups);

    return NextResponse.json({
      monthDays, monthFirstDayOfWeek: firstDayOfWeek, todayDay,
      monthWeeklySummary: weeklySummary, total, prevTotal,
      peakLabel: peakDay.count > 0 ? `${peakDay.day}日` : null,
      isCurrentMonth: month === currentMonthStr,
      topFans, newFans: newFanCount, continuingFans, returningFans,
      linkRanking,
    });
  }

  // ---- 年 ----
  if (period === "yearly") {
    const year = parseInt(searchParams.get("year")!);
    const currentYr = new Date(jstNow).getUTCFullYear();
    const currentMo = new Date(jstNow).getUTCMonth();

    const [rows, currentFanGroups, prevFanGroups, newFanCount, linkRanking] = await Promise.all([
      db.kizari.groupBy({
        by: ["date"],
        where: { creatorId: profile.id, date: { gte: `${year - 1}-01-01`, lte: `${year}-12-31` } },
        _count: { id: true },
      }),
      db.kizari.groupBy({ by: ["fanId"], where: { creatorId: profile.id, date: { gte: `${year}-01-01`, lte: `${year}-12-31` } }, _count: { id: true } }),
      db.kizari.groupBy({ by: ["fanId"], where: { creatorId: profile.id, date: { gte: `${year - 1}-01-01`, lte: `${year - 1}-12-31` } }, _count: { id: true } }),
      db.fanFollow.count({
        where: {
          creatorId: profile.id,
          createdAt: { gte: new Date(`${year}-01-01T00:00:00+09:00`), lt: new Date(`${year + 1}-01-01T00:00:00+09:00`) },
        },
      }),
      getLinkRanking(profile.id, { date: { gte: `${year}-01-01`, lte: `${year}-12-31` } }),
    ]);

    const dateMap = Object.fromEntries(rows.map((r) => [r.date, r._count.id]));

    const monthCards = Array.from({ length: 12 }, (_, mo) => {
      const monthStr = `${year}-${pad(mo + 1)}`;
      const days = new Date(Date.UTC(year, mo + 1, 0)).getUTCDate();
      const count = Array.from({ length: days }, (_, d) =>
        dateMap[`${monthStr}-${pad(d + 1)}`] ?? 0
      ).reduce((s, n) => s + n, 0);
      return { label: `${mo + 1}月`, count, isCurrent: year === currentYr && mo === currentMo };
    });
    const total = monthCards.reduce((s, m) => s + m.count, 0);

    const prevTotal = Array.from({ length: 12 }, (_, mo) => {
      const monthStr = `${year - 1}-${pad(mo + 1)}`;
      const days = new Date(Date.UTC(year - 1, mo + 1, 0)).getUTCDate();
      return Array.from({ length: days }, (_, d) =>
        dateMap[`${monthStr}-${pad(d + 1)}`] ?? 0
      ).reduce((s, n) => s + n, 0);
    }).reduce((s, n) => s + n, 0);

    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const yearHeatmap = Array.from({ length: isLeap ? 366 : 365 }, (_, i) => {
      const d = new Date(Date.UTC(year, 0, i + 1)).toISOString().slice(0, 10);
      return { count: dateMap[d] ?? 0 };
    });
    const startDow = new Date(Date.UTC(year, 0, 1)).getUTCDay();
    const peak = monthCards.reduce((max, m) => m.count > max.count ? m : max, monthCards[0]);

    const currentFanIds = new Set(currentFanGroups.map((r) => r.fanId));
    const prevFanIds = new Set(prevFanGroups.map((r) => r.fanId));
    const { continuingFans, returningFans } = computeTrend(currentFanIds, prevFanIds, newFanCount);
    const topFans = await getTopFans(currentFanGroups);

    return NextResponse.json({
      monthCards, yearHeatmap, yearHeatmapStartDayOfWeek: startDow,
      total, prevTotal,
      peakLabel: peak.count > 0 ? peak.label : null,
      isCurrentYear: year === currentYr,
      topFans, newFans: newFanCount, continuingFans, returningFans,
      linkRanking,
    });
  }

  return NextResponse.json({ error: "Invalid period" }, { status: 400 });
}
