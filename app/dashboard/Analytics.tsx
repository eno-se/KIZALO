"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import Image from "next/image";
import FanRoster from "./FanRoster";
import AtRiskFanRoster from "./AtRiskFanRoster";

// ---- Types ----

type HourData = { hour: number; count: number };
type DayData = { label: string; count: number };
type MonthDayData = { day: number; count: number };
type MonthCardData = { label: string; count: number; isCurrent: boolean };
type FanEntry = { id: string; name: string; time: string };
type TopFanEntry = { id: string; name: string; count: number };
type LinkEntry = { linkId: string; label: string; platform: string; count: number };

type DailyState = {
  hourlyData: HourData[];
  total: number;
  prevTotal: number;
  peakLabel: string | null;
  newFans: number;
  continuingFans: number;
  returningFans: number;
  fanList: FanEntry[];
  isToday: boolean;
  linkRanking: LinkEntry[];
};

type WeeklyState = {
  weekData: DayData[];
  total: number;
  prevTotal: number;
  peakLabel: string | null;
  isCurrentWeek: boolean;
  topFans: TopFanEntry[];
  newFans: number;
  continuingFans: number;
  returningFans: number;
  linkRanking: LinkEntry[];
};

type MonthlyState = {
  monthDays: MonthDayData[];
  monthFirstDayOfWeek: number;
  todayDay: number;
  monthWeeklySummary: number[];
  total: number;
  prevTotal: number;
  peakLabel: string | null;
  isCurrentMonth: boolean;
  topFans: TopFanEntry[];
  newFans: number;
  continuingFans: number;
  returningFans: number;
  linkRanking: LinkEntry[];
};

type YearlyState = {
  monthCards: MonthCardData[];
  yearHeatmap: { count: number }[];
  yearHeatmapStartDayOfWeek: number;
  total: number;
  prevTotal: number;
  peakLabel: string | null;
  isCurrentYear: boolean;
  topFans: TopFanEntry[];
  newFans: number;
  continuingFans: number;
  returningFans: number;
  linkRanking: LinkEntry[];
};

export type AnalyticsProps = {
  initialDate: string;
  initialWeekStart: string;
  initialMonth: string;
  initialYear: number;
};

type Tab = "daily" | "weekly" | "monthly" | "yearly";

// ---- Helpers ----

function heatBg(count: number, max: number): string {
  if (count === 0) return "transparent";
  const t = Math.min(count / Math.max(max * 0.5, 1), 1);
  return `rgba(185, 138, 245, ${(0.15 + t * 0.85).toFixed(2)})`;
}

function pctText(total: number, prev: number, prevLabel = "前期") {
  if (prev === 0) return { label: total > 0 ? "初データ" : "—", color: "text-slate-400" };
  const pct = Math.round(((total - prev) / prev) * 100);
  if (pct === 0) return { label: `${prevLabel}と同じ`, color: "text-slate-400" };
  return { label: pct > 0 ? `${prevLabel}より +${pct}%` : `${prevLabel}より ${pct}%`, color: pct > 0 ? "text-emerald-500" : "text-rose-400" };
}

function addDaysClient(dateStr: string, n: number): string {
  const [yr, mo, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(yr, mo - 1, day + n)).toISOString().slice(0, 10);
}

function addMonthsClient(monthStr: string, n: number): string {
  const [yr, mo] = monthStr.split("-").map(Number);
  const abs = yr * 12 + (mo - 1) + n;
  return `${Math.floor(abs / 12)}-${String((abs % 12) + 1).padStart(2, "0")}`;
}

function formatDateJa(dateStr: string): string {
  const [yr, mo, day] = dateStr.split("-").map(Number);
  return `${yr}年${mo}月${day}日`;
}

function formatMonthJa(monthStr: string): string {
  const [yr, mo] = monthStr.split("-").map(Number);
  return `${yr}年${mo}月`;
}

function formatWeekRange(weekStart: string): string {
  const end = addDaysClient(weekStart, 6);
  const [sy, sm, sd] = weekStart.split("-").map(Number);
  const [, em, ed] = end.split("-").map(Number);
  if (sm === em) return `${sy}年${sm}月${sd}〜${ed}日`;
  return `${sy}年${sm}月${sd}日〜${em}月${ed}日`;
}

const CalendarIcon = () => (
  <span className="inline-block flex-shrink-0" style={{
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
);

// ---- Sub-components ----

function StatsRow({ total, prevTotal, label, prevLabel }: { total: number; prevTotal: number; label: string; prevLabel?: string }) {
  const { label: pLabel, color } = pctText(total, prevTotal, prevLabel);
  return (
    <div className="mb-4">
      <div className="text-xs text-slate-400 mb-0.5">{label}の刻み</div>
      <div className="text-3xl font-bold brand-gradient-text">{total}</div>
      <div className={`text-xs font-semibold mt-0.5 ${color}`}>{pLabel}</div>
    </div>
  );
}

function NavBar({
  label, onPrev, onNext, disableNext, loading, onToggleCal,
}: {
  label: string; onPrev: () => void; onNext: () => void;
  disableNext: boolean; loading: boolean; onToggleCal?: () => void;
}) {
  return (
    <div className="flex items-center mb-3">
      <button onClick={onPrev} disabled={loading} className="w-9 h-9 flex items-center justify-center cursor-pointer disabled:opacity-40">
        <span className="more-icon" style={{ transform: "scaleX(-1)" }} />
      </button>
      <button onClick={onToggleCal} className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
        {onToggleCal && <CalendarIcon />}
        {label}
      </button>
      <button onClick={onNext} disabled={disableNext || loading} className="w-9 h-9 flex items-center justify-center cursor-pointer disabled:opacity-40">
        <span className="more-icon" style={{ opacity: disableNext ? 0.2 : 1 }} />
      </button>
    </div>
  );
}

function CalendarGrid({
  calMonth, selectedDate, maxDate, onSelect, onMonthChange,
}: {
  calMonth: string; selectedDate: string; maxDate: string;
  onSelect: (date: string) => void; onMonthChange: (month: string) => void;
}) {
  const [y, m] = calMonth.split("-").map(Number);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: ({ date: string; day: number } | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d });
  }
  const prevMon = addMonthsClient(calMonth, -1);
  const nextMon = addMonthsClient(calMonth, 1);
  const canGoNext = nextMon <= maxDate.slice(0, 7);
  return (
    <div className="glass-card rounded-2xl px-4 pt-3 pb-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onMonthChange(prevMon)} className="w-8 h-8 flex items-center justify-center cursor-pointer">
          <span className="more-icon" style={{ transform: "scaleX(-1)" }} />
        </button>
        <span className="text-xs font-bold text-slate-700">{formatMonthJa(calMonth)}</span>
        <button onClick={() => canGoNext && onMonthChange(nextMon)} disabled={!canGoNext} className="w-8 h-8 flex items-center justify-center cursor-pointer">
          <span className="more-icon" style={{ opacity: canGoNext ? 1 : 0.2 }} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div key={d} className="text-center text-slate-300 font-medium" style={{ fontSize: "0.6rem" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} />;
          const isFuture = cell.date > maxDate;
          const isSelected = cell.date === selectedDate;
          return (
            <button key={cell.date} onClick={() => !isFuture && onSelect(cell.date)} disabled={isFuture}
              className={`h-8 flex items-center justify-center rounded-lg text-xs transition-colors
                ${isSelected ? "glass-btn-primary font-bold" : ""}
                ${!isSelected && !isFuture ? "text-slate-700 hover:bg-white/40 cursor-pointer" : ""}
                ${isFuture ? "text-slate-300 cursor-default" : ""}
              `}>
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearPicker({ selectedYear, maxYear, onSelect }: {
  selectedYear: number; maxYear: number; onSelect: (year: number) => void;
}) {
  const startYear = Math.max(maxYear - 7, 2020);
  const years = Array.from({ length: maxYear - startYear + 1 }, (_, i) => startYear + i);
  return (
    <div className="glass-card rounded-2xl px-4 pt-3 pb-4 mt-2">
      <div className="grid grid-cols-4 gap-2">
        {years.map((year) => (
          <button key={year} onClick={() => onSelect(year)}
            className={`py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer
              ${year === selectedYear ? "glass-btn-primary" : "text-slate-600 hover:bg-white/40"}
            `}>
            {year}年
          </button>
        ))}
      </div>
    </div>
  );
}

function MonthGrid({
  calYear, selectedMonth, maxMonth, onSelect, onYearChange,
}: {
  calYear: number; selectedMonth: string; maxMonth: string;
  onSelect: (month: string) => void; onYearChange: (year: number) => void;
}) {
  const maxYear = parseInt(maxMonth.slice(0, 4));
  const canGoNext = calYear < maxYear;
  return (
    <div className="glass-card rounded-2xl px-4 pt-3 pb-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onYearChange(calYear - 1)} className="w-8 h-8 flex items-center justify-center cursor-pointer">
          <span className="more-icon" style={{ transform: "scaleX(-1)" }} />
        </button>
        <span className="text-xs font-bold text-slate-700">{calYear}年</span>
        <button onClick={() => canGoNext && onYearChange(calYear + 1)} disabled={!canGoNext} className="w-8 h-8 flex items-center justify-center cursor-pointer">
          <span className="more-icon" style={{ opacity: canGoNext ? 1 : 0.2 }} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, mo) => {
          const monthStr = `${calYear}-${String(mo + 1).padStart(2, "0")}`;
          const isFuture = monthStr > maxMonth;
          const isSelected = monthStr === selectedMonth;
          return (
            <button key={monthStr} onClick={() => !isFuture && onSelect(monthStr)} disabled={isFuture}
              className={`py-2 rounded-xl text-xs font-semibold transition-colors
                ${isSelected ? "glass-btn-primary" : ""}
                ${!isSelected && !isFuture ? "text-slate-600 hover:bg-white/40 cursor-pointer" : ""}
                ${isFuture ? "text-slate-200 cursor-default" : ""}
              `}>
              {mo + 1}月
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RoundedBarChart({ data, labelStep, selectedIdx, onBarClick }: {
  data: DayData[]; labelStep: number;
  selectedIdx?: number | null;
  onBarClick?: (idx: number) => void;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const hasSelection = selectedIdx != null;
  return (
    <div>
      <div className="flex items-end gap-0.5" style={{ height: "4.5rem" }}>
        {data.map(({ count }, i) => {
          const isSelected = selectedIdx === i;
          const dimmed = hasSelection && !isSelected;
          return (
            <div key={i} className="flex-1 relative" style={{ height: "100%", display: "flex", alignItems: "flex-end" }}>
              <div
                onClick={() => onBarClick?.(i)}
                style={{
                  width: "100%",
                  height: `${Math.max((count / max) * 100, count > 0 ? 6 : 2)}%`,
                  minHeight: "2px",
                  background: count > 0 ? "linear-gradient(180deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" : "#f1f5f9",
                  borderRadius: "4px 4px 2px 2px",
                  opacity: dimmed ? 0.3 : 1,
                  cursor: onBarClick ? "pointer" : "default",
                  boxShadow: isSelected && count > 0 ? "0 0 6px rgba(185,138,245,0.6)" : "none",
                  transition: "opacity 0.15s, box-shadow 0.15s",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5 mt-0.5">
        {data.map(({ label }, i) => (
          <div key={i} className="flex-1 text-center overflow-hidden" style={{
            fontSize: "0.5rem",
            color: selectedIdx === i ? "#B98AF5" : "#94a3b8",
            fontWeight: selectedIdx === i ? "bold" : "normal",
            lineHeight: 1,
          }}>
            {i % labelStep === 0 ? label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthCalendar({ days, firstDayOfWeek, todayDay, weeklySummary }: {
  days: MonthDayData[]; firstDayOfWeek: number; todayDay: number; weeklySummary: number[];
}) {
  const max = Math.max(...days.map((d) => d.count), 1);
  const cells: ({ day: number; count: number } | null)[] = [...Array(firstDayOfWeek).fill(null), ...days];
  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div key={d} className="text-center text-slate-300" style={{ fontSize: "0.6rem" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => (
          <div key={i} className="flex items-center justify-center" style={{
            aspectRatio: "1", borderRadius: "6px",
            background: cell ? heatBg(cell.count, max) : "transparent",
            border: cell?.day === todayDay ? "1.5px solid #B98AF5" : "1.5px solid transparent",
          }}>
            {cell && (
              <span style={{ fontSize: "0.6rem", color: cell.count > 0 ? "#7c3aed" : "#94a3b8", fontWeight: cell.day === todayDay ? "bold" : "normal" }}>
                {cell.day}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="text-xs text-slate-400 mb-1">週別まとめ</div>
        {weeklySummary.map((sum, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-8">第{i + 1}週</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${Math.max((sum / Math.max(...weeklySummary, 1)) * 100, sum > 0 ? 4 : 0)}%`,
                background: "linear-gradient(90deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
              }} />
            </div>
            <span className="text-xs text-slate-500 w-8 text-right">{sum}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function YearHeatmap({ monthCards, yearHeatmap, year }: {
  monthCards: MonthCardData[]; yearHeatmap: { count: number }[]; startDayOfWeek: number; year: number;
}) {
  const max = Math.max(...yearHeatmap.map((d) => d.count), 1);
  let idx = 0;
  const months = Array.from({ length: 12 }, (_, mo) => {
    const daysInMonth = new Date(Date.UTC(year, mo + 1, 0)).getUTCDate();
    const firstDow = new Date(Date.UTC(year, mo, 1)).getUTCDay();
    const days = Array.from({ length: daysInMonth }, () => yearHeatmap[idx++] ?? { count: 0 });
    return { mo, firstDow, days };
  });
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {months.map(({ mo, firstDow, days }) => {
        const { label, count, isCurrent } = monthCards[mo];
        const cells: ({ count: number } | null)[] = [...Array(firstDow).fill(null), ...days];
        return (
          <div key={mo} className="rounded-xl p-2.5" style={{
            background: isCurrent
              ? "linear-gradient(135deg, rgba(245,139,203,0.08) 0%, rgba(185,138,245,0.08) 100%)"
              : "#f8fafc",
            border: isCurrent ? "1px solid rgba(185,138,245,0.3)" : "1px solid #f1f5f9",
          }}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-bold" style={isCurrent ? {
                background: "linear-gradient(135deg, #F58BCB, #B98AF5, #7DB7FF)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              } : { color: "#64748b" }}>
                {label}
              </span>
              <span className="font-semibold text-slate-400" style={{ fontSize: "0.65rem" }}>{count}</span>
            </div>
            <div className="grid grid-cols-7 gap-px">
              {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
                <div key={d} className="text-center" style={{ fontSize: "0.42rem", color: "#cbd5e1", lineHeight: "1.5" }}>{d}</div>
              ))}
              {cells.map((cell, ci) => (
                <div key={ci} style={{
                  aspectRatio: "1", borderRadius: "2px",
                  background: cell ? heatBg(cell.count, max) : "transparent",
                }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10" style={{ background: "rgba(255,255,255,0.6)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loading.gif" alt="loading" style={{ width: 80, height: 80 }} />
    </div>
  );
}

function FanList({ fanList }: { fanList: FanEntry[] }) {
  const [open, setOpen] = useState(false);
  if (fanList.length === 0) return <p className="text-xs text-slate-400">まだ誰も刻んでいません</p>;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-xs text-slate-500 flex items-center gap-1 cursor-pointer">
        <span>{fanList.length}人が刻みました</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
          {fanList.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-slate-700 truncate">{f.name}</span>
              <span className="text-slate-400 ml-2 flex-shrink-0">{f.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopFanList({ fans }: { fans: TopFanEntry[] }) {
  const [open, setOpen] = useState(false);
  if (fans.length === 0) return <p className="text-xs text-slate-400">まだデータがありません</p>;
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="text-xs text-slate-500 flex items-center gap-1 cursor-pointer">
        <span>{fans.length}人がランクイン</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
          {fans.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2 text-xs">
              <span className="text-slate-300 font-bold w-4 flex-shrink-0">{i + 1}</span>
              <span className="text-slate-700 flex-1 truncate">{f.name}</span>
              <span className="text-slate-400 flex-shrink-0">{f.count}回</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendStats({ newFans, continuingFans, returningFans }: {
  newFans: number; continuingFans: number; returningFans: number;
}) {
  return (
    <div className="space-y-2.5">
      {[
        { label: "新規", value: newFans },
        { label: "継続", value: continuingFans },
        { label: "復帰", value: returningFans },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between text-sm">
          <span className="text-slate-600">{label}</span>
          <span className="font-semibold text-slate-700">+{value ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

function LinkRankMini({ links }: { links: LinkEntry[] }) {
  const max = Math.max(...links.map((l) => l.count), 1);
  return (
    <>
      <div className="text-xs text-slate-400 mb-2">押されたリンク</div>
      {links.length === 0 ? (
        <p className="text-xs text-slate-400">まだデータがありません</p>
      ) : (
        <div className="space-y-2">
          {links.slice(0, 5).map((link, i) => (
            <div key={`${link.linkId}-${link.platform}-${i}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-slate-600 truncate">{link.label}</span>
                <span className="text-xs font-semibold text-slate-400 ml-1 flex-shrink-0">{link.count}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.round((link.count / max) * 100)}%`,
                  background: "linear-gradient(90deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ---- Empty initial states ----

function makeEmptyDaily(): DailyState {
  return {
    hourlyData: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 })),
    total: 0, prevTotal: 0, peakLabel: null,
    newFans: 0, continuingFans: 0, returningFans: 0,
    fanList: [], isToday: true, linkRanking: [],
  };
}

function makeEmptyWeekly(): WeeklyState {
  return {
    weekData: ["月", "火", "水", "木", "金", "土", "日"].map((label) => ({ label, count: 0 })),
    total: 0, prevTotal: 0, peakLabel: null, isCurrentWeek: true,
    topFans: [], newFans: 0, continuingFans: 0, returningFans: 0, linkRanking: [],
  };
}

function makeEmptyMonthly(initialMonth: string): MonthlyState {
  const [yr, mo] = initialMonth.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
  return {
    monthDays: Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, count: 0 })),
    monthFirstDayOfWeek: new Date(Date.UTC(yr, mo - 1, 1)).getUTCDay(),
    todayDay: 0,
    monthWeeklySummary: [],
    total: 0, prevTotal: 0, peakLabel: null, isCurrentMonth: true,
    topFans: [], newFans: 0, continuingFans: 0, returningFans: 0, linkRanking: [],
  };
}

function makeEmptyYearly(initialYear: number): YearlyState {
  const isLeap = (initialYear % 4 === 0 && initialYear % 100 !== 0) || initialYear % 400 === 0;
  return {
    monthCards: Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, count: 0, isCurrent: false })),
    yearHeatmap: Array.from({ length: isLeap ? 366 : 365 }, () => ({ count: 0 })),
    yearHeatmapStartDayOfWeek: new Date(Date.UTC(initialYear, 0, 1)).getUTCDay(),
    total: 0, prevTotal: 0, peakLabel: null, isCurrentYear: true,
    topFans: [], newFans: 0, continuingFans: 0, returningFans: 0, linkRanking: [],
  };
}

// ---- CSV Export ----

function CsvExportCard() {
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/dashboard/export?type=daily");
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename\*=UTF-8''(.+)/);
      a.download = match ? decodeURIComponent(match[1]) : "kizalo-daily.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="text-xs text-slate-400 mb-4">CSVダウンロード</div>
      <div className="border border-slate-100 rounded-xl p-3.5">
        <p className="text-sm font-semibold text-slate-700 mb-0.5">日別集計</p>
        <p className="text-xs text-slate-500 mb-0.5">最初の刻りから今日まで・全期間</p>
        <p className="text-xs text-slate-400 mb-3">日付 / 刻り数</p>
        <button
          onClick={download}
          disabled={downloading}
          className="glass-btn-secondary w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
        >
          {downloading ? "準備中..." : "⬇ ダウンロード"}
        </button>
      </div>
    </div>
  );
}

// ---- Main ----

export default function Analytics({
  initialDate, initialWeekStart, initialMonth, initialYear,
}: AnalyticsProps) {
  const [tab, setTab] = useState<Tab>("daily");
  const [isPending, startTransition] = useTransition();

  // Daily
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dailyData, setDailyData] = useState<DailyState>(() => makeEmptyDaily());
  const [showDayCal, setShowDayCal] = useState(false);
  const [dayCalMonth, setDayCalMonth] = useState(initialDate.slice(0, 7));
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Weekly
  const [selectedWeekStart, setSelectedWeekStart] = useState(initialWeekStart);
  const [weeklyData, setWeeklyData] = useState<WeeklyState>(() => makeEmptyWeekly());
  const [showWeekCal, setShowWeekCal] = useState(false);
  const [weekCalMonth, setWeekCalMonth] = useState(initialWeekStart.slice(0, 7));
  const [selectedWeekDay, setSelectedWeekDay] = useState<number | null>(null);

  // Monthly
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [monthlyData, setMonthlyData] = useState<MonthlyState>(() => makeEmptyMonthly(initialMonth));
  const [showMonthCal, setShowMonthCal] = useState(false);
  const [monthCalYear, setMonthCalYear] = useState(initialYear);

  // Yearly
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [yearlyData, setYearlyData] = useState<YearlyState>(() => makeEmptyYearly(initialYear));
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Track initial fetch for 週/月/年
  const weeklyLoaded = useRef(false);
  const monthlyLoaded = useRef(false);
  const yearlyLoaded = useRef(false);

  const fetchDaily = useCallback((date: string) => {
    setSelectedDate(date);
    setDayCalMonth(date.slice(0, 7));
    setShowDayCal(false);
    setSelectedHour(null);
    startTransition(async () => {
      const res = await fetch(`/api/dashboard/analytics?period=daily&date=${date}`);
      setDailyData(await res.json());
    });
  }, []);

  const fetchWeekly = useCallback((weekStart: string) => {
    setSelectedWeekStart(weekStart);
    setWeekCalMonth(weekStart.slice(0, 7));
    setShowWeekCal(false);
    setSelectedWeekDay(null);
    startTransition(async () => {
      const res = await fetch(`/api/dashboard/analytics?period=weekly&weekStart=${weekStart}`);
      setWeeklyData(await res.json());
    });
  }, []);

  const fetchMonthly = useCallback((month: string) => {
    setSelectedMonth(month);
    setShowMonthCal(false);
    startTransition(async () => {
      const res = await fetch(`/api/dashboard/analytics?period=monthly&month=${month}`);
      setMonthlyData(await res.json());
    });
  }, []);

  const fetchYearly = useCallback((year: number) => {
    setSelectedYear(year);
    startTransition(async () => {
      const res = await fetch(`/api/dashboard/analytics?period=yearly&year=${year}`);
      setYearlyData(await res.json());
    });
  }, []);

  // マウント時に日タブのデータを取得
  useEffect(() => {
    fetchDaily(initialDate);
  }, []); // eslint-disable-line

  // 初回タブ切り替え時に trend/topFans を含む完全データをフェッチ
  useEffect(() => {
    if (tab === "weekly" && !weeklyLoaded.current) {
      weeklyLoaded.current = true;
      fetchWeekly(initialWeekStart);
    } else if (tab === "monthly" && !monthlyLoaded.current) {
      monthlyLoaded.current = true;
      fetchMonthly(initialMonth);
    } else if (tab === "yearly" && !yearlyLoaded.current) {
      yearlyLoaded.current = true;
      fetchYearly(initialYear);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const TABS: { key: Tab; label: string }[] = [
    { key: "daily", label: "日" },
    { key: "weekly", label: "週" },
    { key: "monthly", label: "月" },
    { key: "yearly", label: "年" },
  ];

  return (
    <div className="space-y-3">
      {/* タブヘッダー */}
      <div className="glass-card rounded-2xl px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">アナリティクス</span>
        <div className="flex gap-1">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)} className={`text-xs px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${tab === key ? "glass-btn-primary" : "text-slate-400"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- 日 ---- */}
      {tab === "daily" && (
        <>
          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <NavBar
              label={formatDateJa(selectedDate)}
              onPrev={() => fetchDaily(addDaysClient(selectedDate, -1))}
              onNext={() => fetchDaily(addDaysClient(selectedDate, 1))}
              disableNext={selectedDate >= initialDate}
              loading={isPending}
              onToggleCal={() => { setShowDayCal((v) => !v); setDayCalMonth(selectedDate.slice(0, 7)); }}
            />
            {showDayCal && (
              <CalendarGrid calMonth={dayCalMonth} selectedDate={selectedDate} maxDate={initialDate}
                onSelect={fetchDaily} onMonthChange={setDayCalMonth} />
            )}
            <div className={showDayCal ? "mt-4" : ""}>
              <StatsRow total={dailyData.total} prevTotal={dailyData.prevTotal} label={dailyData.isToday ? "今日" : selectedDate.slice(5).replace("-", "/")} prevLabel="前日" />
              <RoundedBarChart
                data={dailyData.hourlyData.map((d) => ({ label: `${d.hour}`, count: d.count }))}
                labelStep={6}
                selectedIdx={selectedHour}
                onBarClick={(idx) => setSelectedHour(selectedHour === idx ? null : idx)}
              />
              {selectedHour !== null && (() => {
                const fans = dailyData.fanList.filter((f) => parseInt(f.time.split(":")[0]) === selectedHour);
                return (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2">
                      <span className="font-semibold brand-gradient-text">{selectedHour}時台</span>
                      {" · "}{fans.length}人
                    </p>
                    {fans.length === 0 ? (
                      <p className="text-xs text-slate-400">この時間帯に刻んだ人はいません</p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {fans.map((f, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-slate-700 truncate">{f.name}</span>
                            <span className="text-slate-400 ml-2 flex-shrink-0">{f.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-2">ハイライト</div>
            {dailyData.peakLabel ? (
              <>
                <p className="text-sm text-slate-700 mb-1">
                  <span className="font-semibold brand-gradient-text">{dailyData.peakLabel}</span>に一番刻まれました
                </p>
                <p className="text-3xl font-bold brand-gradient-text">
                  {Math.max(...dailyData.hourlyData.map((d) => d.count), 0)}
                  <span className="text-base font-semibold">回</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">データがありません</p>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-3">刻んだ人</div>
            <FanList fanList={dailyData.fanList} />
          </div>

          {dailyData.isToday && (
            <div className="glass-card rounded-2xl p-5 relative">
              <div className="text-xs text-slate-400 mb-0.5">まだ来ていない常連</div>
              <div className="text-xs text-slate-300 mb-3">昨日刻んで今日まだ来ていない人</div>
              <AtRiskFanRoster />
            </div>
          )}

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <LinkRankMini links={dailyData.linkRanking} />
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-0.5">刻みの傾向</div>
            <div className="text-xs text-slate-300 mb-3">前日と比較</div>
            <TrendStats newFans={dailyData.newFans} continuingFans={dailyData.continuingFans} returningFans={dailyData.returningFans} />
          </div>
        </>
      )}

      {/* ---- 週 ---- */}
      {tab === "weekly" && (
        <>
          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <NavBar
              label={formatWeekRange(selectedWeekStart)}
              onPrev={() => fetchWeekly(addDaysClient(selectedWeekStart, -7))}
              onNext={() => fetchWeekly(addDaysClient(selectedWeekStart, 7))}
              disableNext={weeklyData.isCurrentWeek}
              loading={isPending}
              onToggleCal={() => { setShowWeekCal((v) => !v); setWeekCalMonth(selectedWeekStart.slice(0, 7)); }}
            />
            {showWeekCal && (
              <CalendarGrid
                calMonth={weekCalMonth}
                selectedDate={selectedWeekStart}
                maxDate={initialDate}
                onSelect={(date) => {
                  const dow = new Date(date + "T00:00:00Z").getUTCDay();
                  fetchWeekly(addDaysClient(date, -((dow - 1 + 7) % 7)));
                }}
                onMonthChange={setWeekCalMonth}
              />
            )}
            <div className={showWeekCal ? "mt-4" : ""}>
              <StatsRow total={weeklyData.total} prevTotal={weeklyData.prevTotal} label="今週" prevLabel="先週" />
              <RoundedBarChart
                data={weeklyData.weekData}
                labelStep={1}
                selectedIdx={selectedWeekDay}
                onBarClick={(idx) => setSelectedWeekDay(selectedWeekDay === idx ? null : idx)}
              />
              {selectedWeekDay !== null && (() => {
                const d = weeklyData.weekData[selectedWeekDay];
                const DAY_FULL: Record<string, string> = { 月: "月曜日", 火: "火曜日", 水: "水曜日", 木: "木曜日", 金: "金曜日", 土: "土曜日", 日: "日曜日" };
                return (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold brand-gradient-text">{DAY_FULL[d.label] ?? d.label}</span>
                      {" · "}{d.count}人
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-2">ハイライト</div>
            {weeklyData.peakLabel ? (
              <>
                <p className="text-sm text-slate-700 mb-1">
                  <span className="font-semibold brand-gradient-text">
                    {({ 月: "月曜日", 火: "火曜日", 水: "水曜日", 木: "木曜日", 金: "金曜日", 土: "土曜日", 日: "日曜日" } as Record<string, string>)[weeklyData.peakLabel] ?? weeklyData.peakLabel}
                  </span>に一番刻まれました
                </p>
                <p className="text-3xl font-bold brand-gradient-text">
                  {Math.max(...weeklyData.weekData.map((d) => d.count), 0)}
                  <span className="text-base font-semibold">回</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">データがありません</p>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-3">刻んだ人</div>
            <FanRoster period="weekly" weekStart={selectedWeekStart} />
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <LinkRankMini links={weeklyData.linkRanking} />
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-0.5">刻みの傾向</div>
            <div className="text-xs text-slate-300 mb-3">前週と比較</div>
            <TrendStats newFans={weeklyData.newFans} continuingFans={weeklyData.continuingFans} returningFans={weeklyData.returningFans} />
          </div>
        </>
      )}

      {/* ---- 月 ---- */}
      {tab === "monthly" && (
        <>
          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <NavBar
              label={formatMonthJa(selectedMonth)}
              onPrev={() => fetchMonthly(addMonthsClient(selectedMonth, -1))}
              onNext={() => fetchMonthly(addMonthsClient(selectedMonth, 1))}
              disableNext={monthlyData.isCurrentMonth}
              loading={isPending}
              onToggleCal={() => { setShowMonthCal((v) => !v); setMonthCalYear(parseInt(selectedMonth.slice(0, 4))); }}
            />
            {showMonthCal && (
              <MonthGrid calYear={monthCalYear} selectedMonth={selectedMonth} maxMonth={initialMonth}
                onSelect={fetchMonthly} onYearChange={setMonthCalYear} />
            )}
            <div className={showMonthCal ? "mt-4" : ""}>
              <StatsRow total={monthlyData.total} prevTotal={monthlyData.prevTotal} label={monthlyData.isCurrentMonth ? "今月" : formatMonthJa(selectedMonth)} prevLabel="先月" />
              <MonthCalendar days={monthlyData.monthDays} firstDayOfWeek={monthlyData.monthFirstDayOfWeek}
                todayDay={monthlyData.todayDay} weeklySummary={monthlyData.monthWeeklySummary} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-2">ハイライト</div>
            {monthlyData.peakLabel ? (
              <>
                <p className="text-sm text-slate-700 mb-1">
                  <span className="font-semibold brand-gradient-text">{monthlyData.peakLabel}</span>に一番刻まれました
                </p>
                <p className="text-3xl font-bold brand-gradient-text">
                  {Math.max(...monthlyData.monthDays.map((d) => d.count), 0)}
                  <span className="text-base font-semibold">回</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">データがありません</p>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-3">刻んだ人</div>
            <FanRoster period="monthly" month={selectedMonth} />
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <LinkRankMini links={monthlyData.linkRanking} />
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-0.5">刻みの傾向</div>
            <div className="text-xs text-slate-300 mb-3">前月と比較</div>
            <TrendStats newFans={monthlyData.newFans} continuingFans={monthlyData.continuingFans} returningFans={monthlyData.returningFans} />
          </div>
        </>
      )}

      {/* ---- 年 ---- */}
      {tab === "yearly" && (
        <>
          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <NavBar
              label={`${selectedYear}年`}
              onPrev={() => fetchYearly(selectedYear - 1)}
              onNext={() => fetchYearly(selectedYear + 1)}
              disableNext={yearlyData.isCurrentYear}
              loading={isPending}
              onToggleCal={() => setShowYearPicker((v) => !v)}
            />
            {showYearPicker && (
              <YearPicker
                selectedYear={selectedYear}
                maxYear={initialYear}
                onSelect={(year) => { fetchYearly(year); setShowYearPicker(false); }}
              />
            )}
            <div className={showYearPicker ? "mt-4" : ""}>
              <StatsRow total={yearlyData.total} prevTotal={yearlyData.prevTotal} label={yearlyData.isCurrentYear ? "今年" : `${selectedYear}年`} prevLabel="去年" />
              <YearHeatmap monthCards={yearlyData.monthCards} yearHeatmap={yearlyData.yearHeatmap}
                startDayOfWeek={yearlyData.yearHeatmapStartDayOfWeek} year={selectedYear} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-2">ハイライト</div>
            {yearlyData.peakLabel ? (
              <>
                <p className="text-sm text-slate-700 mb-1">
                  <span className="font-semibold brand-gradient-text">{yearlyData.peakLabel}</span>に一番刻まれました
                </p>
                <p className="text-3xl font-bold brand-gradient-text">
                  {Math.max(...yearlyData.monthCards.map((m) => m.count), 0)}
                  <span className="text-base font-semibold">回</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">データがありません</p>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-3">刻んだ人</div>
            <FanRoster period="yearly" year={String(selectedYear)} />
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <LinkRankMini links={yearlyData.linkRanking} />
          </div>

          <div className="glass-card rounded-2xl p-5 relative">
            {isPending && <LoadingOverlay />}
            <div className="text-xs text-slate-400 mb-0.5">刻みの傾向</div>
            <div className="text-xs text-slate-300 mb-3">前年と比較</div>
            <TrendStats newFans={yearlyData.newFans} continuingFans={yearlyData.continuingFans} returningFans={yearlyData.returningFans} />
          </div>
        </>
      )}

      <CsvExportCard />
    </div>
  );
}
