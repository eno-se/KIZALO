"use client";

import { useState } from "react";

export default function CollapsibleCard({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400">{title}</p>
          {!open && summary && (
            <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{summary}</p>
          )}
        </div>
        <span
          className="flex-shrink-0 ml-3 text-slate-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}
