"use client";

import { useState } from "react";

export default function DemoMoreButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="text-center mt-4">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1 text-xs brand-gradient-text font-bold"
        >
          もっと見る<span className="more-icon" />
        </button>
      </div>

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
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">キザリスト</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              今日刻んでくれた全員の名前を一覧で見られます。<br />
              最速・連続・累計などの実績も確認できます。
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="text-xs text-slate-400"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
