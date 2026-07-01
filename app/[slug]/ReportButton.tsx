"use client";

import { useState } from "react";
import ReportModal from "@/app/components/ReportModal";

export default function ReportButton({ targetUserId }: { targetUserId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-slate-400 hover:text-red-400 transition-colors"
      >
        通報する
      </button>
      {open && <ReportModal targetUserId={targetUserId} onClose={() => setOpen(false)} />}
    </>
  );
}
