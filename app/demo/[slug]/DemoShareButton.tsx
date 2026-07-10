"use client";

import { useState } from "react";

export default function DemoShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed top-[56px] left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-lg mx-auto px-6">
          <div className="flex flex-col gap-2 pointer-events-auto w-fit ml-auto">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-full glass-btn-secondary text-xs font-semibold text-slate-600"
            >
              共有
            </button>
          </div>
        </div>
      </div>

      {copied && (
        <div
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 px-4 py-2.5 rounded-full text-xs font-semibold text-white shadow-lg pointer-events-none"
          style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
        >
          リンクをコピーしました
        </div>
      )}
    </>
  );
}
