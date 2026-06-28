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
  const activeTab = sp.tab === "streak" ? "streak" : sp.tab === "most" ? "most" : "fastest";
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
    include: { fan: { select: { id: true, displayName: true, name: true, creatorProfile: { select: { iconUrl: true } } } } },
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
          orderBy: [{ streakDays: "desc" }, { id: "asc" }],
          include: { fan: { select: { id: true, displayName: true, name: true, creatorProfile: { select: { iconUrl: true } } } } },
          take: INITIAL_TAKE + 1,
        })
      : [];
  const hasMoreStreak = streakRaw.length > INITIAL_TAKE;

  // Most: first 30+1 FanFollows by totalKizari desc
  const mostRaw =
    fanIds.length > 0
      ? await db.fanFollow.findMany({
          where: { creatorId: creator.id, fanId: { in: fanIds } },
          orderBy: [{ totalKizari: "desc" }, { id: "asc" }],
          include: { fan: { select: { id: true, displayName: true, name: true, creatorProfile: { select: { iconUrl: true } } } } },
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
    fanImage: k.fan.creatorProfile?.iconUrl ?? null,
    createdAt: k.createdAt.toISOString(),
  }));

  const streakItems = streakRaw.slice(0, INITIAL_TAKE).map((f, i) => ({
    id: f.id,
    rank: i + 1,
    fanId: f.fanId,
    fanName: f.fan.displayName ?? f.fan.name ?? "名無し",
    fanHandle: f.fan.displayName ? (f.fan.name ?? null) : null,
    fanImage: f.fan.creatorProfile?.iconUrl ?? null,
    streakDays: f.streakDays,
    maxStreakDays: f.maxStreakDays,
    totalKizari: f.totalKizari,
  }));

  const mostItems = mostRaw.slice(0, INITIAL_TAKE).map((f, i) => ({
    id: f.id,
    rank: i + 1,
    fanId: f.fanId,
    fanName: f.fan.displayName ?? f.fan.name ?? "名無し",
    fanHandle: f.fan.displayName ? (f.fan.name ?? null) : null,
    fanImage: f.fan.creatorProfile?.iconUrl ?? null,
    totalKizari: f.totalKizari,
  }));

  const totalCount = fanIds.length;

  // 自分の順位（その日に刻んでいる場合のみ）
  let myFastestRank: number | null = null;
  let myFastestTime: string | null = null;
  let myStreakRank: number | null = null;
  let myStreakDays: number | null = null;
  let myMostRank: number | null = null;
  let myTotalKizari: number | null = null;
  let myDisplayName: string | null = null;
  let myIconUrl: string | null = null;

  if (myUserId && fanIds.includes(myUserId)) {
    const [myKizari, myFollow, myUser] = await Promise.all([
      db.kizari.findUnique({
        where: { fanId_creatorId_date: { fanId: myUserId, creatorId: creator.id, date: selectedDate } },
      }),
      db.fanFollow.findUnique({
        where: { fanId_creatorId: { fanId: myUserId, creatorId: creator.id } },
      }),
      db.user.findUnique({
        where: { id: myUserId },
        select: { displayName: true, name: true, creatorProfile: { select: { iconUrl: true } } },
      }),
    ]);
    myDisplayName = myUser?.displayName ?? myUser?.name ?? null;
    myIconUrl = myUser?.creatorProfile?.iconUrl ?? null;

    if (myKizari) {
      const fasterCount = await db.kizari.count({
        where: { creatorId: creator.id, date: selectedDate, createdAt: { lt: myKizari.createdAt } },
      });
      myFastestRank = fasterCount + 1;
      myFastestTime = myKizari.createdAt.toISOString();
    }

    if (myFollow) {
      const [betterStreakCount, betterMostCount] = await Promise.all([
        db.fanFollow.count({
          where: { creatorId: creator.id, fanId: { in: fanIds }, streakDays: { gt: myFollow.streakDays } },
        }),
        db.fanFollow.count({
          where: { creatorId: creator.id, fanId: { in: fanIds }, totalKizari: { gt: myFollow.totalKizari } },
        }),
      ]);
      myStreakRank = betterStreakCount + 1;
      myStreakDays = myFollow.streakDays;
      myMostRank = betterMostCount + 1;
      myTotalKizari = myFollow.totalKizari;
    }
  }

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
      myFastestRank={myFastestRank}
      myFastestTime={myFastestTime}
      myStreakRank={myStreakRank}
      myStreakDays={myStreakDays}
      myMostRank={myMostRank}
      myTotalKizari={myTotalKizari}
      myDisplayName={myDisplayName}
      myIconUrl={myIconUrl}
    />
  );
}
