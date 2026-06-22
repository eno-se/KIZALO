import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getJstDateString } from "@/lib/jst";
import KizarisClient from "./KizarisClient";

const INITIAL_TAKE = 30;

export default async function KizarisPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; tab?: string; month?: string; cal?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const today = getJstDateString();
  const selectedDate = sp.date ?? today;
  const activeTab = sp.tab === "streak" ? "streak" : "fastest";
  const showCalendar = sp.cal === "1";
  const calendarMonth = sp.month ?? selectedDate.slice(0, 7);

  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    select: { id: true, displayName: true, iconUrl: true, isPublic: true },
  });
  if (!creator || !creator.isPublic) notFound();

  const session = await auth();
  const myUserId = session?.user.id ?? null;

  // Fastest: first 30+1 ordered by createdAt asc
  const fastestRaw = await db.kizari.findMany({
    where: { creatorId: creator.id, date: selectedDate },
    include: { fan: { select: { id: true, displayName: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" },
    take: INITIAL_TAKE + 1,
  });
  const hasMoreFastest = fastestRaw.length > INITIAL_TAKE;

  // Streak: get all fan IDs, then first 30+1 FanFollows by streakDays desc
  const allFanIds = await db.kizari.findMany({
    where: { creatorId: creator.id, date: selectedDate },
    select: { fanId: true },
  });
  const fanIds = allFanIds.map((k) => k.fanId);

  const streakRaw =
    fanIds.length > 0
      ? await db.fanFollow.findMany({
          where: { creatorId: creator.id, fanId: { in: fanIds } },
          orderBy: { streakDays: "desc" },
          include: { fan: { select: { id: true, displayName: true, name: true, image: true } } },
          take: INITIAL_TAKE + 1,
        })
      : [];
  const hasMoreStreak = streakRaw.length > INITIAL_TAKE;

  // Most: first 30+1 FanFollows by totalKizari desc
  const mostRaw =
    fanIds.length > 0
      ? await db.fanFollow.findMany({
          where: { creatorId: creator.id, fanId: { in: fanIds } },
          orderBy: { totalKizari: "desc" },
          include: { fan: { select: { id: true, displayName: true, name: true, image: true } } },
          take: INITIAL_TAKE + 1,
        })
      : [];
  const hasMoreMost = mostRaw.length > INITIAL_TAKE;

  // Calendar: unique dates with kizaris in calendarMonth
  const [cy, cm] = calendarMonth.split("-").map(Number);
  const lastDay = new Date(cy, cm, 0).getDate();
  const monthStart = `${cy}-${String(cm).padStart(2, "0")}-01`;
  const monthEnd = `${cy}-${String(cm).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const kizariDates = await db.kizari.findMany({
    where: { creatorId: creator.id, date: { gte: monthStart, lte: monthEnd } },
    select: { date: true },
    distinct: ["date"],
  });

  const fastestItems = fastestRaw.slice(0, INITIAL_TAKE).map((k, i) => ({
    id: k.id,
    rank: i + 1,
    fanId: k.fanId,
    fanName: k.fan.displayName ?? k.fan.name ?? "名無し",
    fanHandle: k.fan.displayName ? (k.fan.name ?? null) : null,
    fanImage: k.fan.image ?? null,
    createdAt: k.createdAt.toISOString(),
  }));

  const streakItems = streakRaw.slice(0, INITIAL_TAKE).map((f, i) => ({
    id: `${f.fanId}-${f.creatorId}`,
    rank: i + 1,
    fanId: f.fanId,
    fanName: f.fan.displayName ?? f.fan.name ?? "名無し",
    fanHandle: f.fan.displayName ? (f.fan.name ?? null) : null,
    fanImage: f.fan.image ?? null,
    streakDays: f.streakDays,
    maxStreakDays: f.maxStreakDays,
    totalKizari: f.totalKizari,
  }));

  const mostItems = mostRaw.slice(0, INITIAL_TAKE).map((f, i) => ({
    id: `most-${f.fanId}`,
    rank: i + 1,
    fanId: f.fanId,
    fanName: f.fan.displayName ?? f.fan.name ?? "名無し",
    fanHandle: f.fan.displayName ? (f.fan.name ?? null) : null,
    fanImage: f.fan.image ?? null,
    totalKizari: f.totalKizari,
  }));

  const totalCount = fanIds.length;

  return (
    <KizarisClient
      slug={slug}
      creatorName={creator.displayName}
      creatorIconUrl={creator.iconUrl ?? null}
      selectedDate={selectedDate}
      today={today}
      activeTab={activeTab as "fastest" | "streak" | "most"}
      showCalendar={showCalendar}
      calendarMonth={calendarMonth}
      fastestItems={fastestItems}
      hasMoreFastest={hasMoreFastest}
      streakItems={streakItems}
      hasMoreStreak={hasMoreStreak}
      mostItems={mostItems}
      hasMoreMost={hasMoreMost}
      totalCount={totalCount}
      datesWithKizari={kizariDates.map((k) => k.date)}
      myUserId={myUserId}
    />
  );
}
