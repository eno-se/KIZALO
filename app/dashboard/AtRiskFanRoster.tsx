"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

type Fan = {
  id: string;
  name: string;
  iconUrl: string | null;
  streakDays: number;
};

export default function AtRiskFanRoster() {
  const [fans, setFans] = useState<Fan[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [yesterdayTotal, setYesterdayTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const fetchFans = useCallback(async (currentSkip: number, reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const res = await fetch(`/api/dashboard/at-risk-fans?skip=${currentSkip}`);
    const data = await res.json();
    setFans((prev) => reset ? data.fans : [...prev, ...data.fans]);
    setHasMore(data.hasMore);
    setTotal(data.total);
    setYesterdayTotal(data.yesterdayTotal);
    setSkip(currentSkip + data.fans.length);
    loadingRef.current = false;
    setLoading(false);
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    fetchFans(0, true);
  }, []); // eslint-disable-line

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingRef.current || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      fetchFans(skip, false);
    }
  }, [hasMore, skip, fetchFans]);

  if (initialLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10" style={{ background: "rgba(255,255,255,0.6)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/loading.gif" alt="loading" style={{ width: 80, height: 80 }} />
      </div>
    );
  }

  if (fans.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        {yesterdayTotal === 0 ? "昨日の刻みはありませんでした" : "昨日刻んだ全員がすでに来ています"}
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">{total}人がまだ来ていません</p>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="overflow-y-auto"
        style={{ maxHeight: 280 }}
      >
        <div className="space-y-2.5 pr-1">
          {fans.map((fan) => (
            <div key={fan.id} className="flex items-center gap-2.5">
              <div
                className="rounded-full overflow-hidden flex-shrink-0 bg-pink-50 flex items-center justify-center"
                style={{ width: 28, height: 28 }}
              >
                {fan.iconUrl
                  ? <Image src={fan.iconUrl} alt={fan.name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized />
                  : <span className="text-xs font-bold text-[#F58BCB]">{fan.name[0]}</span>}
              </div>
              <span className="text-xs text-slate-700 flex-1 truncate font-medium">{fan.name}</span>
              <span className="text-xs text-slate-400 flex-shrink-0">🔥{fan.streakDays}日</span>
            </div>
          ))}
        </div>
        {loading && (
          <p className="text-center text-xs text-slate-400 mt-2">読み込み中...</p>
        )}
        {!hasMore && fans.length >= 10 && (
          <p className="text-center text-xs text-slate-300 mt-2">以上</p>
        )}
      </div>
    </div>
  );
}
