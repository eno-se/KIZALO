import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getJstDateString, getJstYesterdayString } from "@/lib/jst";
import Analytics from "./Analytics";

const JST = 9 * 60 * 60 * 1000;

function addDays(dateStr: string, n: number): string {
  const [yr, mo, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, day + n)).toISOString().slice(0, 10);
}

function toLinks(rows: { linkId: string; label: string; platform: string; _count: { id: number } }[]) {
  return rows.map((r) => ({ linkId: r.linkId, label: r.label, platform: r.platform, count: r._count.id }))
    .sort((a, b) => b.count - a.count);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { creatorProfile: true },
  });

  if (!user) redirect("/login");
  if (!user.displayName) redirect("/setup");

  const profile = user.creatorProfile;

  if (!profile) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-28">
        <div className="mb-6"><h1 className="text-xl font-bold text-slate-800">ダッシュボード</h1></div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-500 mb-3">まだ推しページが作成されていません</p>
          <a href="/edit" className="glass-btn-primary inline-block px-6 py-2.5 rounded-xl text-sm font-semibold">ページを作成する</a>
        </div>
      </div>
    );
  }

  const jstNow = Date.now() + JST;
  const todayStr = getJstDateString();
  const yesterdayStr = getJstYesterdayString();
  const todayStart = new Date(todayStr + "T00:00:00+09:00");

  const jstDate = new Date(jstNow);
  const currentYear = jstDate.getUTCFullYear();
  const currentMonth = jstDate.getUTCMonth(); // 0-based
  const todayDay = jstDate.getUTCDate();
  const todayDow = jstDate.getUTCDay(); // 0=Sun
  const daysFromMonday = (todayDow - 1 + 7) % 7;

  // 今週の月曜日
  const mondayMs = jstNow - daysFromMonday * 24 * 60 * 60 * 1000;
  const initialWeekStart = new Date(mondayMs).toISOString().slice(0, 10);
  const initialMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(initialWeekStart, i));
  const daysInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

  // 並列クエリ（初期データ）
  const [
    todayKizarisWithFan,
    yesterdayCount,
    bigRange,
    newFanCount,
    continuingFanCount,
    returningFanCount,
    linkDaily,
    linkWeekly,
    linkMonthly,
    linkYearly,
  ] = await Promise.all([
    db.kizari.findMany({
      where: { creatorId: profile.id, date: todayStr },
      include: { fan: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.kizari.count({ where: { creatorId: profile.id, date: yesterdayStr } }),
    db.kizari.groupBy({
      by: ["date"],
      where: { creatorId: profile.id, date: { gte: `${currentYear - 1}-01-01`, lte: `${currentYear}-12-31` } },
      _count: { id: true },
    }),
    db.fanFollow.count({ where: { creatorId: profile.id, createdAt: { gte: todayStart } } }),
    db.fanFollow.count({ where: { creatorId: profile.id, streakDays: { gt: 1 }, lastKizariAt: { gte: todayStart } } }),
    db.fanFollow.count({ where: { creatorId: profile.id, streakDays: 1, totalKizari: { gt: 1 }, lastKizariAt: { gte: todayStart } } }),
    db.linkClick.groupBy({ by: ["linkId", "label", "platform"], where: { creatorId: profile.id, date: todayStr }, _count: { id: true } }),
    db.linkClick.groupBy({ by: ["linkId", "label", "platform"], where: { creatorId: profile.id, date: { in: weekDates } }, _count: { id: true } }),
    db.linkClick.groupBy({ by: ["linkId", "label", "platform"], where: { creatorId: profile.id, date: { gte: `${initialMonth}-01`, lte: `${initialMonth}-${String(daysInCurrentMonth).padStart(2, "0")}` } }, _count: { id: true } }),
    db.linkClick.groupBy({ by: ["linkId", "label", "platform"], where: { creatorId: profile.id, date: { gte: `${currentYear}-01-01`, lte: `${currentYear}-12-31` } }, _count: { id: true } }),
  ]);

  const dateMap = Object.fromEntries(bigRange.map((r) => [r.date, r._count.id]));

  // ---- 日 ----
  const hourMap: Record<number, number> = {};
  const fanList = todayKizarisWithFan.map((k) => {
    const jstTime = new Date(k.createdAt.getTime() + JST);
    const h = jstTime.getUTCHours();
    hourMap[h] = (hourMap[h] ?? 0) + 1;
    return {
      id: k.fan.id,
      name: k.fan.displayName || "ファン",
      time: `${String(h).padStart(2, "0")}:${String(jstTime.getUTCMinutes()).padStart(2, "0")}`,
    };
  });
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap[h] ?? 0 }));
  const peakHour = hourlyData.reduce((max, d) => d.count > max.count ? d : max, hourlyData[0]);

  // ---- 週 ----
  const DAY = ["月", "火", "水", "木", "金", "土", "日"];
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayMs + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { label: DAY[i], count: dateMap[d] ?? 0 };
  });
  const weekTotal = weekData.reduce((s, d) => s + d.count, 0);
  const prevWeekTotal = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayMs + (i - 7) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return dateMap[d] ?? 0;
  }).reduce((s, n) => s + n, 0);
  const peakWeekDay = weekData.reduce((max, d) => d.count > max.count ? d : max, weekData[0]);

  // ---- 月 ----
  const firstDayOfWeek = new Date(Date.UTC(currentYear, currentMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
  const curMonthPfx = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    count: dateMap[`${curMonthPfx}-${String(i + 1).padStart(2, "0")}`] ?? 0,
  }));
  const monthTotal = monthDays.reduce((s, d) => s + d.count, 0);
  const prevAbs = currentYear * 12 + currentMonth - 1;
  const prevYr = Math.floor(prevAbs / 12);
  const prevMo = prevAbs % 12 + 1;
  const prevPfx = `${prevYr}-${String(prevMo).padStart(2, "0")}`;
  const prevDaysInMonth = new Date(Date.UTC(prevYr, prevMo, 0)).getUTCDate();
  const prevMonthTotal = Array.from({ length: prevDaysInMonth }, (_, i) =>
    dateMap[`${prevPfx}-${String(i + 1).padStart(2, "0")}`] ?? 0
  ).reduce((s, n) => s + n, 0);
  const peakMonthDay = monthDays.reduce((max, d) => d.count > max.count ? d : max, monthDays[0]);
  const monthWeeklySummary: number[] = [];
  let weekSum = 0;
  for (let i = 0; i < daysInMonth; i++) {
    weekSum += monthDays[i].count;
    if ((i + firstDayOfWeek + 1) % 7 === 0 || i === daysInMonth - 1) { monthWeeklySummary.push(weekSum); weekSum = 0; }
  }

  // ---- 年（カレンダー年 Jan-Dec） ----
  const monthCards = Array.from({ length: 12 }, (_, mo) => {
    const pfx = `${currentYear}-${String(mo + 1).padStart(2, "0")}`;
    const days = new Date(Date.UTC(currentYear, mo + 1, 0)).getUTCDate();
    const count = Array.from({ length: days }, (_, d) =>
      dateMap[`${pfx}-${String(d + 1).padStart(2, "0")}`] ?? 0
    ).reduce((s, n) => s + n, 0);
    return { label: `${mo + 1}月`, count, isCurrent: mo === currentMonth };
  });
  const yearTotal = monthCards.reduce((s, m) => s + m.count, 0);
  const prevYearTotal = Array.from({ length: 12 }, (_, mo) => {
    const pfx = `${currentYear - 1}-${String(mo + 1).padStart(2, "0")}`;
    const days = new Date(Date.UTC(currentYear - 1, mo + 1, 0)).getUTCDate();
    return Array.from({ length: days }, (_, d) =>
      dateMap[`${pfx}-${String(d + 1).padStart(2, "0")}`] ?? 0
    ).reduce((s, n) => s + n, 0);
  }).reduce((s, n) => s + n, 0);
  const peakMonth = monthCards.reduce((max, m) => m.count > max.count ? m : max, monthCards[0]);
  const isLeap = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0;
  const yearHeatmap = Array.from({ length: isLeap ? 366 : 365 }, (_, i) => {
    const d = new Date(Date.UTC(currentYear, 0, i + 1)).toISOString().slice(0, 10);
    return { count: dateMap[d] ?? 0 };
  });
  const yearHeatmapStartDayOfWeek = new Date(Date.UTC(currentYear, 0, 1)).getUTCDay();

  const analyticsProps = {
    initialDate: todayStr,
    initialWeekStart,
    initialMonth,
    initialYear: currentYear,
    daily: {
      hourlyData,
      total: todayKizarisWithFan.length,
      prevTotal: yesterdayCount,
      peakLabel: peakHour.count > 0 ? `${peakHour.hour}時台` : null,
      newFans: newFanCount,
      continuingFans: continuingFanCount,
      returningFans: returningFanCount,
      fanList,
      isToday: true,
      linkRanking: toLinks(linkDaily),
    },
    weekly: {
      weekData,
      total: weekTotal,
      prevTotal: prevWeekTotal,
      peakLabel: peakWeekDay.count > 0 ? peakWeekDay.label : null,
      isCurrentWeek: true,
      topFans: [],
      newFans: 0,
      continuingFans: 0,
      returningFans: 0,
      linkRanking: toLinks(linkWeekly),
    },
    monthly: {
      monthDays,
      monthFirstDayOfWeek: firstDayOfWeek,
      todayDay,
      monthWeeklySummary,
      total: monthTotal,
      prevTotal: prevMonthTotal,
      peakLabel: peakMonthDay.count > 0 ? `${peakMonthDay.day}日` : null,
      isCurrentMonth: true,
      topFans: [],
      newFans: 0,
      continuingFans: 0,
      returningFans: 0,
      linkRanking: toLinks(linkMonthly),
    },
    yearly: {
      monthCards,
      yearHeatmap,
      yearHeatmapStartDayOfWeek,
      total: yearTotal,
      prevTotal: prevYearTotal,
      peakLabel: peakMonth.count > 0 ? peakMonth.label : null,
      isCurrentYear: true,
      topFans: [],
      newFans: 0,
      continuingFans: 0,
      returningFans: 0,
      linkRanking: toLinks(linkYearly),
    },
  };

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-28">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">ダッシュボード</h1>
      </div>
      <div className="space-y-4">
        <Analytics {...analyticsProps} />
      </div>
    </div>
  );
}
