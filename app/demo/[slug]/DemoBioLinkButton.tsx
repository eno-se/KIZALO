"use client";

import { useState } from "react";

export default function DemoBioLinkButton({ label }: { label: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #B98AF5 0%, #7DB7FF 100%)" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span>{label}</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl px-6 py-8 text-center"
            style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">メインリンク</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              実際のプロフィールでは、ライブ予約やSNSなど好きなページへのリンクボタンを設置できます。
            </p>
            <button onClick={() => setShowModal(false)} className="text-xs text-slate-400">
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
