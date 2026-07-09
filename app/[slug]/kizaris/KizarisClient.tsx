"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type FastestItem = {
  id: string;
  rank: number;
  fanId: string;
  fanName: string;
  fanHandle: string | null;
  fanImage: string | null;
  createdAt: string;
};

type StreakItem = {
  id: string;
  rank: number;
  fanId: string;
  fanName: string;
  fanHandle: string | null;
  fanImage: string | null;
  streakDays: number;
  maxStreakDays: number;
  totalKizari: number;
};

type MostItem = {
  id: string;
  rank: number;
  fanId: string;
  fanName: string;
  fanHandle: string | null;
  fanImage: string | null;
  totalKizari: number;
};

type Props = {
  slug: string;
  creatorName: string;
  creatorIconUrl: string | null;
  selectedDate: string;
  today: string;
  activeTab: "fastest" | "streak" | "most";
  showCalendar: boolean;
  calendarMonth: string;
  fastestItems: FastestItem[];
  hasMoreFastest: boolean;
  streakItems: StreakItem[];
  hasMoreStreak: boolean;
  mostItems: MostItem[];
  hasMoreMost: boolean;
  totalCount: number;
  datesWithKizari: string[];
  myUserId: string | null;
  myFastestRank: number | null;
  myFastestTime: string | null;
  myStreakRank: number | null;
  myStreakDays: number | null;
  myMostRank: number | null;
  myTotalKizari: number | null;
  myDisplayName: string | null;
  myIconUrl: string | null;
};

function formatJstTime(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function formatDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

function formatMonth(s: string) {
  const [y, m] = s.split("-").map(Number);
  return `${y}年${m}月`;
}

function addDays(s: string, n: number) {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function addMonths(s: string, n: number) {
  const [y, m] = s.split("-").map(Number);
  const dt = new Date(y, m - 1 + n, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalGrid(yearMonth: string) {
  const [y, m] = yearMonth.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: Array<{ date: string; day: number } | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function FanAvatar({ image, name }: { image?: string | null; name: string }) {
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 bg-pink-50 flex items-center justify-center" style={{ width: 32, height: 32 }}>
      {image
        ? <Image src={image} alt={name} width={32} height={32} className="object-cover" style={{ width: 32, height: 32 }} unoptimized />
        : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>
      }
    </div>
  );
}

const RANK_ICONS = ["/rank1-icon.png", "/rank2-icon.png", "/rank3-icon.png"];
const RANK_GRADIENTS = [
  "linear-gradient(160deg, #FFF1B8 0%, #FFD76A 55%, #F5C040 100%)",
  "linear-gradient(160deg, #F2F3FF 0%, #C9C7E8 55%, #B0AEDD 100%)",
  "linear-gradient(160deg, #FFD1B8 0%, #E9A06F 55%, #D98A58 100%)",
];
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function KizarisClient({
  slug,
  creatorName,
  creatorIconUrl,
  selectedDate,
  today,
  activeTab: initTab,
  showCalendar: initShowCal,
  calendarMonth,
  fastestItems: initFastestItems,
  hasMoreFastest: initHasMoreFastest,
  streakItems: initStreakItems,
  hasMoreStreak: initHasMoreStreak,
  mostItems: initMostItems,
  hasMoreMost: initHasMoreMost,
  totalCount,
  datesWithKizari,
  myUserId,
  myFastestRank,
  myFastestTime,
  myStreakRank,
  myStreakDays,
  myMostRank,
  myTotalKizari,
  myDisplayName,
  myIconUrl,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"fastest" | "streak" | "most">(initTab);
  const [showCal, setShowCal] = useState(initShowCal);

  const [fastest, setFastest] = useState({ items: initFastestItems, hasMore: initHasMoreFastest, skip: initFastestItems.length });
  const [streak, setStreak] = useState({ items: initStreakItems, hasMore: initHasMoreStreak, skip: initStreakItems.length });
  const [most, setMost] = useState({ items: initMostItems, hasMore: initHasMoreMost, skip: initMostItems.length });
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    const state = tab === "fastest" ? fastest : tab === "streak" ? streak : most;
    const setState = tab === "fastest" ? setFastest : tab === "streak" ? setStreak : setMost;
    if (!state.hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/kizaris?slug=${slug}&date=${selectedDate}&tab=${tab}&skip=${state.skip}`);
      const data = await res.json();
      setState((s: typeof state) => {
        const existingIds = new Set(s.items.map((i) => i.id));
        const newItems = data.items.filter((i: { id: string }) => !existingIds.has(i.id));
        return {
          items: [...s.items, ...newItems],
          hasMore: data.hasMore,
          skip: s.skip + data.items.length,
        };
      });
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [tab, fastest, streak, most, slug, selectedDate]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "150px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const datesSet = new Set(datesWithKizari);
  const calGrid = buildCalGrid(calendarMonth);
  const isToday = selectedDate === today;
  const canGoNext = addDays(selectedDate, 1) <= today;
  const prevMon = addMonths(calendarMonth, -1);
  const nextMon = addMonths(calendarMonth, 1);
  const canGoNextMon = nextMon <= today.slice(0, 7);

  const goDate = (date: string) => {
    setShowCal(false);
    router.push(`/${slug}/kizaris?date=${date}&tab=${tab}`);
  };

  const goMonth = (month: string) => {
    router.push(`/${slug}/kizaris?date=${selectedDate}&tab=${tab}&month=${month}&cal=1`);
  };

  const isEmpty = totalCount === 0;

  return (
    <div className="min-h-screen px-4 pt-0 pb-10 max-w-lg mx-auto">

      {/* Sticky block: profile + date nav + tabs */}
      <div
        className="sticky top-9 z-30 -mx-4 px-4 pb-3 pt-2 flex flex-col gap-3"
        style={{ background: "linear-gradient(180deg, rgba(253,244,251,0.97) 80%, transparent 100%)" }}
      >
        {/* Profile card */}
        <Link href={`/${slug}`} className="glass-card rounded-2xl flex items-center gap-3 px-4 py-2.5">
          <div
            className="rounded-full p-[2px] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
          >
            <div className="rounded-full bg-white p-[2px]" style={{ width: 38, height: 38 }}>
              <div className="rounded-full overflow-hidden" style={{ width: 34, height: 34 }}>
                {creatorIconUrl ? (
                  <Image
                    src={creatorIconUrl}
                    alt={creatorName}
                    width={34}
                    height={34}
                    className="object-cover"
                    style={{ width: 34, height: 34 }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center text-sm font-bold text-[#F58BCB] bg-pink-50"
                    style={{ width: 34, height: 34 }}
                  >
                    {creatorName[0]}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">{creatorName}</p>
            <p className="text-xs text-slate-400 leading-tight">@{slug}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 text-xs brand-gradient-text font-bold">
            もっと見る<span className="more-icon" />
          </span>
        </Link>

        {/* Date navigation */}
        <div className="glass-card rounded-2xl px-3 py-2.5">
          <div className="flex items-center">
            <button onClick={() => goDate(addDays(selectedDate, -1))} className="w-9 h-9 flex items-center justify-center">
              <span className="more-icon" style={{ transform: "scaleX(-1)" }} />
            </button>
            <button
              onClick={() => setShowCal((v) => !v)}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-slate-700"
            >
              <span className="inline-block" style={{
                width: 12, height: 12,
                background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
                WebkitMaskImage: "url('/calendar.png')",
                maskImage: "url('/calendar.png')",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }} />
              {formatDate(selectedDate)}
            </button>
            <button onClick={() => canGoNext && goDate(addDays(selectedDate, 1))} disabled={!canGoNext} className="w-9 h-9 flex items-center justify-center">
              <span className="more-icon" style={{ opacity: canGoNext ? 1 : 0.2 }} />
            </button>
          </div>
          {!isToday && (
            <div className="text-center mt-1">
              <button onClick={() => goDate(today)} className="text-xs brand-gradient-text font-bold">
                今日に戻る
              </button>
            </div>
          )}
        </div>

        {/* Calendar */}
      {showCal && (
        <div className="glass-card rounded-2xl px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => goMonth(prevMon)} className="w-8 h-8 flex items-center justify-center">
              <span className="more-icon" style={{ transform: "scaleX(-1)" }} />
            </button>
            <span className="text-xs font-bold text-slate-700">{formatMonth(calendarMonth)}</span>
            <button onClick={() => canGoNextMon && goMonth(nextMon)} disabled={!canGoNextMon} className="w-8 h-8 flex items-center justify-center">
              <span className="more-icon" style={{ opacity: canGoNextMon ? 1 : 0.2 }} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-slate-300 font-medium" style={{ fontSize: "0.6rem" }}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {calGrid.map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} />;
              const isFuture = cell.date > today;
              const isSelected = cell.date === selectedDate;
              const hasDot = datesSet.has(cell.date);
              return (
                <button
                  key={cell.date}
                  onClick={() => !isFuture && goDate(cell.date)}
                  disabled={isFuture}
                  className={`relative h-8 flex flex-col items-center justify-center rounded-lg text-xs transition-colors
                    ${isSelected ? "glass-btn-primary text-white font-bold" : ""}
                    ${!isSelected && !isFuture ? "text-slate-700 hover:bg-white/40" : ""}
                    ${isFuture ? "text-slate-300 cursor-default" : ""}
                  `}
                >
                  {cell.day}
                  {hasDot && !isSelected && (
                    <span
                      className="absolute bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: "linear-gradient(135deg, #F58BCB, #B98AF5, #7DB7FF)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

        {/* Tabs */}
        <div className="flex gap-2">
          {(["fastest", "streak", "most"] as const).map((t) => {
            const label = t === "fastest" ? "最速" : t === "streak" ? "継続" : "最多";
            const icon = t === "fastest" ? "/fastest-icon.png" : t === "streak" ? "/streak-icon.png" : "/most-icon.png";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5
                  ${tab === t ? "glass-btn-primary" : "glass-btn-secondary"}`}
              >
                <Image
                  src={icon}
                  alt=""
                  width={14}
                  height={14}
                  className="object-contain"
                  style={tab !== t ? { filter: "brightness(0) saturate(100%) invert(52%) sepia(15%) saturate(800%) hue-rotate(230deg)" } : undefined}
                />
                {label}
              </button>
            );
          })}
        </div>

        {/* 自分の順位（タブ下固定） */}
        {(() => {
          const myRank = tab === "fastest" ? myFastestRank : tab === "streak" ? myStreakRank : myMostRank;
          if (!myRank) return null;
          return (
            <div className="glass-card rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <div className="rounded-full overflow-hidden flex-shrink-0 bg-pink-50 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                {myIconUrl
                  ? <Image src={myIconUrl} alt="" width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized />
                  : <span className="text-xs font-bold text-[#F58BCB]">{(myDisplayName ?? "あ")[0]}</span>
                }
              </div>
              <span className="text-sm font-bold brand-gradient-text flex-1 truncate">{myDisplayName ?? "あなた"}</span>
              <span className="text-sm font-bold brand-gradient-text flex-shrink-0">{myRank}位</span>
            </div>
          );
        })()}
      </div>{/* end sticky */}

      {/* Count */}
      {!isEmpty && (
        <p className="text-right text-xs text-slate-400 mb-2">{totalCount}人が刻んだ</p>
      )}

      {/* List */}
      {isEmpty ? (
        <div className="glass-card rounded-2xl py-14 px-6 text-center">
          <div className="text-4xl mb-4">💎</div>
          <p className="text-sm font-bold text-slate-400">まだこの日にきざんだ人はいません</p>
          <p className="text-xs text-slate-300 mt-2">最初に刻む人になろう</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {tab === "fastest"
            ? fastest.items.map((item, idx) => (
                <div
                  key={`fastest-${item.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors
                    ${idx > 0 ? "border-t border-white/30" : ""}
                    ${item.fanId === myUserId ? "bg-white/25" : ""}
                  `}
                >
                  {/* Rank */}
                  <div className="w-7 text-center flex-shrink-0">
                    {idx < 3 ? (
                      <span className="block mx-auto" style={{
                        width: 24, height: 24,
                        background: RANK_GRADIENTS[idx],
                        WebkitMaskImage: `url('${RANK_ICONS[idx]}')`,
                        maskImage: `url('${RANK_ICONS[idx]}')`,
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }} />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{item.rank}</span>
                    )}
                  </div>

                  {/* Avatar + Name + ID */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <FanAvatar image={item.fanImage} name={item.fanName} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold truncate ${item.fanId === myUserId ? "brand-gradient-text" : "text-slate-700"}`}>
                          {item.fanName}
                        </span>
                        {item.fanId === myUserId && (
                          <span className="text-xs text-[#B98AF5] flex-shrink-0">あなた</span>
                        )}
                      </div>
                      {item.fanHandle && (
                        <p className="text-slate-400 truncate" style={{ fontSize: "0.6rem" }}>@{item.fanHandle}</p>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-xs text-slate-400 flex-shrink-0 tabular-nums font-mono">
                    {formatJstTime(item.createdAt)}
                  </div>
                </div>
              ))
            : tab === "most"
            ? most.items.map((item, idx) => (
                <div
                  key={`most-${item.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors
                    ${idx > 0 ? "border-t border-white/30" : ""}
                    ${item.fanId === myUserId ? "bg-white/25" : ""}
                  `}
                >
                  <div className="w-7 text-center flex-shrink-0">
                    {idx < 3 ? (
                      <span className="block mx-auto" style={{
                        width: 24, height: 24,
                        background: RANK_GRADIENTS[idx],
                        WebkitMaskImage: `url('${RANK_ICONS[idx]}')`,
                        maskImage: `url('${RANK_ICONS[idx]}')`,
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                      }} />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">{item.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <FanAvatar image={item.fanImage} name={item.fanName} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold truncate ${item.fanId === myUserId ? "brand-gradient-text" : "text-slate-700"}`}>
                          {item.fanName}
                        </span>
                        {item.fanId === myUserId && (
                          <span className="text-xs text-[#B98AF5] flex-shrink-0">あなた</span>
                        )}
                      </div>
                      {item.fanHandle && (
                        <p className="text-slate-400 truncate" style={{ fontSize: "0.6rem" }}>@{item.fanHandle}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold brand-gradient-text leading-tight">{item.totalKizari}</div>
                    <div className="text-slate-400" style={{ fontSize: "0.55rem" }}>総刻り数</div>
                  </div>
                </div>
              ))
            : streak.items.map((item, idx) => {
                const isRecord = item.streakDays > 0 && item.streakDays >= item.maxStreakDays;
                return (
                  <div
                    key={`streak-${item.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 transition-colors
                      ${idx > 0 ? "border-t border-white/30" : ""}
                      ${item.fanId === myUserId ? "bg-white/25" : ""}
                    `}
                  >
                    {/* Rank */}
                    <div className="w-7 text-center flex-shrink-0">
                      {idx < 3 ? (
                        <span className="block mx-auto" style={{
                          width: 24, height: 24,
                          background: RANK_GRADIENTS[idx],
                          WebkitMaskImage: `url('${RANK_ICONS[idx]}')`,
                          maskImage: `url('${RANK_ICONS[idx]}')`,
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskPosition: "center",
                        }} />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">{item.rank}</span>
                      )}
                    </div>

                    {/* Name + badge */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <FanAvatar image={item.fanImage} name={item.fanName} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-sm font-bold ${item.fanId === myUserId ? "brand-gradient-text" : "text-slate-700"}`}>
                            {item.fanName}
                          </span>
                          {item.fanId === myUserId && (
                            <span className="text-xs text-[#B98AF5]">あなた</span>
                          )}
                          {isRecord && (
                            <span
                              className="text-white font-bold rounded-full px-1.5 py-0.5 leading-none"
                              style={{
                                fontSize: "0.5rem",
                                background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
                              }}
                            >
                              🔥 記録更新中
                            </span>
                          )}
                        </div>
                        {item.fanHandle && (
                          <p className="text-slate-400 truncate" style={{ fontSize: "0.6rem" }}>@{item.fanHandle}</p>
                        )}
                        <div className="text-slate-400 mt-0.5" style={{ fontSize: "0.6rem" }}>
                          最高 {item.maxStreakDays}日連続
                        </div>
                      </div>
                    </div>

                    {/* Streak value */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold brand-gradient-text leading-tight">{item.streakDays}</div>
                      <div className="text-slate-400" style={{ fontSize: "0.55rem" }}>連続日</div>
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-2">
        {isLoading && (
          <p className="text-xs text-slate-400">読み込み中...</p>
        )}
      </div>
    </div>
  );
}
