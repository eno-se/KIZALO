"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

type LinkEntry = { linkId: string; label: string; platform: string; count: number };
type PeriodData = { links: LinkEntry[]; total: number; prevTotal: number };

type Props = {
  initialDate: string;
  initialWeekStart: string;
  initialMonth: string;
  initialYear: number;
  daily: PeriodData;
  weekly: PeriodData;
  monthly: PeriodData;
  yearly: PeriodData;
};

function addDays(dateStr: string, n: number): string {
  const [yr, mo, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, day + n)).toISOString().slice(0, 10);
}

async function fetchPeriod(params: Record<string, string>): Promise<PeriodData> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/dashboard/link-analytics?${qs}`);
  return res.json();
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10" style={{ background: "rgba(255,255,255,0.6)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loading.gif" alt="loading" style={{ width: 80, height: 80 }} />
    </div>
  );
}

function NavArrow({ direction, onClick, disabled }: { direction: "prev" | "next"; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="cursor-pointer">
      <span
        className="more-icon"
        style={{
          transform: direction === "prev" ? "scaleX(-1)" : undefined,
          opacity: disabled ? 0.2 : 1,
        }}
      />
    </button>
  );
}

function LinkRank({ links, total, prevTotal }: PeriodData) {
  const diff = total - prevTotal;
  const diffLabel = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : null;

  if (links.length === 0) {
    return <p className="text-xs text-slate-400 py-2">まだデータがありません</p>;
  }

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-slate-700">{total}</span>
        <span className="text-xs text-slate-400">クリック</span>
        {diffLabel && (
          <span className="text-xs font-semibold" style={{ color: diff > 0 ? "#B98AF5" : "#94a3b8" }}>{diffLabel}</span>
        )}
      </div>
      <div className="space-y-2">
        {links.slice(0, 5).map((link, i) => {
          const barPct = links[0].count > 0 ? Math.round((link.count / links[0].count) * 100) : 0;
          return (
            <div key={link.linkId} className="flex items-center gap-2">
              <span className="text-slate-300 font-bold text-xs w-4 text-right flex-shrink-0">{i + 1}</span>
              {link.platform !== "bio" ? (
                <Image
                  src={`/sns/${link.platform}.png`}
                  alt={link.label}
                  width={16}
                  height={16}
                  className="object-contain flex-shrink-0"
                />
              ) : (
                <span
                  className="flex-shrink-0"
                  style={{
                    width: 16, height: 16,
                    maskImage: "url(/link-icon.png)",
                    maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center",
                    WebkitMaskImage: "url(/link-icon.png)",
                    WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center",
                    background: "#94a3b8",
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-slate-700 truncate">{link.label}</span>
                  <span className="text-xs font-semibold text-slate-500 ml-2 flex-shrink-0">{link.count}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${barPct}%`,
                      background: "linear-gradient(90deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LinkAnalytics(props: Props) {
  type Tab = "daily" | "weekly" | "monthly" | "yearly";
  const [tab, setTab] = useState<Tab>("daily");
  const [isPending, startTransition] = useTransition();

  const [selectedDate, setSelectedDate] = useState(props.initialDate);
  const [selectedWeekStart, setSelectedWeekStart] = useState(props.initialWeekStart);
  const [selectedMonth, setSelectedMonth] = useState(props.initialMonth);
  const [selectedYear, setSelectedYear] = useState(props.initialYear);

  const [dailyData, setDailyData] = useState(props.daily);
  const [weeklyData, setWeeklyData] = useState(props.weekly);
  const [monthlyData, setMonthlyData] = useState(props.monthly);
  const [yearlyData, setYearlyData] = useState(props.yearly);

  const today = props.initialDate;
  const initialYear = props.initialYear;
  const initialMonth = props.initialMonth;
  const initialWeekStart = props.initialWeekStart;

  const fetchDaily = (date: string) => {
    setSelectedDate(date);
    startTransition(async () => setDailyData(await fetchPeriod({ period: "daily", date })));
  };
  const fetchWeekly = (weekStart: string) => {
    setSelectedWeekStart(weekStart);
    startTransition(async () => setWeeklyData(await fetchPeriod({ period: "weekly", weekStart })));
  };
  const fetchMonthly = (month: string) => {
    setSelectedMonth(month);
    startTransition(async () => setMonthlyData(await fetchPeriod({ period: "monthly", month })));
  };
  const fetchYearly = (year: number) => {
    setSelectedYear(year);
    startTransition(async () => setYearlyData(await fetchPeriod({ period: "yearly", year: String(year) })));
  };

  // Month arithmetic helpers
  function addMonths(ym: string, n: number): string {
    const [yr, mo] = ym.split("-").map(Number);
    const abs = yr * 12 + (mo - 1) + n;
    return `${Math.floor(abs / 12)}-${String((abs % 12) + 1).padStart(2, "0")}`;
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "daily", label: "日" },
    { key: "weekly", label: "週" },
    { key: "monthly", label: "月" },
    { key: "yearly", label: "年" },
  ];

  // Period labels
  const [wy, wm, wd] = selectedWeekStart.split("-").map(Number);
  const weekEnd = addDays(selectedWeekStart, 6);
  const [ey, em, ed] = weekEnd.split("-").map(Number);
  const weekLabel = `${wm}/${wd}〜${em}/${ed}`;

  const [my, mm] = selectedMonth.split("-").map(Number);

  return (
    <div className="glass-card rounded-2xl p-5 relative">
      {isPending && <LoadingOverlay />}
      <h2 className="text-xs font-bold text-slate-400 mb-3">よく押されたリンク</h2>

      {/* Period tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            style={tab === key ? {
              background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
              color: "#fff",
            } : { color: "#94a3b8" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Daily */}
      {tab === "daily" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <NavArrow direction="prev" onClick={() => fetchDaily(addDays(selectedDate, -1))} />
            <span className="text-xs text-slate-500 font-semibold">
              {selectedDate === today ? "今日" : selectedDate}
            </span>
            <NavArrow direction="next" onClick={() => fetchDaily(addDays(selectedDate, 1))} disabled={selectedDate >= today} />
          </div>
          <LinkRank {...dailyData} />
        </div>
      )}

      {/* Weekly */}
      {tab === "weekly" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <NavArrow direction="prev" onClick={() => fetchWeekly(addDays(selectedWeekStart, -7))} />
            <span className="text-xs text-slate-500 font-semibold">
              {selectedWeekStart === initialWeekStart ? "今週" : weekLabel}
            </span>
            <NavArrow direction="next" onClick={() => fetchWeekly(addDays(selectedWeekStart, 7))} disabled={selectedWeekStart >= initialWeekStart} />
          </div>
          <LinkRank {...weeklyData} />
        </div>
      )}

      {/* Monthly */}
      {tab === "monthly" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <NavArrow direction="prev" onClick={() => fetchMonthly(addMonths(selectedMonth, -1))} />
            <span className="text-xs text-slate-500 font-semibold">
              {selectedMonth === initialMonth ? "今月" : `${my}年${mm}月`}
            </span>
            <NavArrow direction="next" onClick={() => fetchMonthly(addMonths(selectedMonth, 1))} disabled={selectedMonth >= initialMonth} />
          </div>
          <LinkRank {...monthlyData} />
        </div>
      )}

      {/* Yearly */}
      {tab === "yearly" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <NavArrow direction="prev" onClick={() => fetchYearly(selectedYear - 1)} />
            <span className="text-xs text-slate-500 font-semibold">
              {selectedYear === initialYear ? "今年" : `${selectedYear}年`}
            </span>
            <NavArrow direction="next" onClick={() => fetchYearly(selectedYear + 1)} disabled={selectedYear >= initialYear} />
          </div>
          <LinkRank {...yearlyData} />
        </div>
      )}
    </div>
  );
}
