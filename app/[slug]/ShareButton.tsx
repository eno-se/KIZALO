"use client";

import { useState } from "react";

export default function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className="w-8 h-8 flex items-center justify-center rounded-full glass-btn-secondary flex-shrink-0"
        title="リンクをコピー"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>

      {copied && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 px-4 py-2.5 rounded-full text-xs font-semibold text-white shadow-lg pointer-events-none"
          style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
        >
          リンクをコピーしました
        </div>
      )}
    </>
  );
}
