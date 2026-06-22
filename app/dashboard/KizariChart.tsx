"use client";

import { useState } from "react";

type DataPoint = { label: string; count: number };

type Props = {
  daily: DataPoint[];
  weekly: DataPoint[];
  monthly: DataPoint[];
  yearly: DataPoint[];
};

type Tab = "daily" | "weekly" | "monthly" | "yearly";

export default function KizariChart({ daily, weekly, monthly, yearly }: Props) {
  const [tab, setTab] = useState<Tab>("weekly");

  const data = tab === "daily" ? daily : tab === "weekly" ? weekly : tab === "monthly" ? monthly : yearly;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-slate-400">刻み時間</h2>
        <div className="flex gap-1">
          {(["daily", "weekly", "monthly", "yearly"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                tab === t ? "glass-btn-primary" : "text-slate-400"
              }`}
            >
              {t === "daily" ? "日" : t === "weekly" ? "週" : t === "monthly" ? "月" : "年"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        {data.map(({ label, count }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-8 flex-shrink-0 text-right">{label}</span>
            <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
                  minWidth: count > 0 ? "4px" : "0px",
                }}
              />
            </div>
            <span className="text-xs text-slate-500 w-6 flex-shrink-0 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
