"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

type Fan = {
  id: string;
  name: string;
  iconUrl: string | null;
  periodCount: number;
  streakDays: number;
  lastKizariDate: string | null;
};

type Props = {
  period: "weekly" | "monthly" | "yearly";
  weekStart?: string;
  month?: string;
  year?: string;
};

function buildParams(period: string, props: Props) {
  const p = new URLSearchParams({ period, skip: "0" });
  if (period === "weekly" && props.weekStart) p.set("weekStart", props.weekStart);
  if (period === "monthly" && props.month) p.set("month", props.month);
  if (period === "yearly" && props.year) p.set("year", props.year);
  return p;
}

export default function FanRoster(props: Props) {
  const { period } = props;
  const [fans, setFans] = useState<Fan[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const periodKey = `${period}-${props.weekStart ?? ""}-${props.month ?? ""}-${props.year ?? ""}`;

  const fetchFans = useCallback(async (currentSkip: number, reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const p = buildParams(period, props);
    p.set("skip", String(currentSkip));
    const res = await fetch(`/api/dashboard/fans?${p}`);
    const data = await res.json();
    setFans((prev) => reset ? data.fans : [...prev, ...data.fans]);
    setHasMore(data.hasMore);
    setTotal(data.total);
    setSkip(currentSkip + data.fans.length);
    loadingRef.current = false;
    setLoading(false);
    setInitialLoading(false);
  }, [period, props.weekStart, props.month, props.year]); // eslint-disable-line

  useEffect(() => {
    setFans([]);
    setSkip(0);
    setHasMore(false);
    setInitialLoading(true);
    fetchFans(0, true);
  }, [periodKey]); // eslint-disable-line

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingRef.current || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
      fetchFans(skip, false);
    }
  }, [hasMore, skip, fetchFans]);

  if (initialLoading) {
    return <p className="text-xs text-slate-400">読み込み中...</p>;
  }

  if (fans.length === 0) {
    return <p className="text-xs text-slate-400">まだ誰も刻んでいません</p>;
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">{total}人が刻みました</p>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="overflow-y-auto"
        style={{ maxHeight: 280 }}
      >
        <div className="space-y-2.5 pr-1">
          {fans.map((fan, i) => (
            <div key={fan.id} className="flex items-center gap-2.5">
              <span className="text-xs text-slate-300 w-5 text-right flex-shrink-0">{skip - fans.length + i + 1}</span>
              <div className="rounded-full overflow-hidden flex-shrink-0 bg-pink-50 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                {fan.iconUrl
                  ? <Image src={fan.iconUrl} alt={fan.name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized />
                  : <span className="text-xs font-bold text-[#F58BCB]">{fan.name[0]}</span>}
              </div>
              <span className="text-xs text-slate-700 flex-1 truncate font-medium">{fan.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0 text-right">
                <div className="text-right">
                  <p className="text-xs font-bold brand-gradient-text leading-none">{fan.periodCount}回</p>
                  <p className="text-slate-400 leading-none mt-0.5" style={{ fontSize: "0.6rem" }}>
                    🔥{fan.streakDays}日
                  </p>
                </div>
                {fan.lastKizariDate && (
                  <p className="text-slate-300 w-14 text-right" style={{ fontSize: "0.6rem" }}>
                    {fan.lastKizariDate.slice(5).replace("-", "/")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {loading && (
          <p className="text-center text-xs text-slate-400 mt-2">読み込み中...</p>
        )}
        {!hasMore && fans.length > 0 && fans.length >= 10 && (
          <p className="text-center text-xs text-slate-300 mt-2">以上</p>
        )}
      </div>
    </div>
  );
}
