"use client";

import { useState } from "react";
import Image from "next/image";

type SnsLink = { platform: string; label: string };

export default function DemoSnsIcons({ links }: { links: SnsLink[] }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex gap-2 mb-3 flex-wrap justify-center">
        {links.map((link) => (
          <button
            key={link.platform}
            onClick={() => setShowModal(true)}
            className="glass-btn-secondary w-10 h-10 rounded-xl flex items-center justify-center"
          >
            <Image src={`/sns/${link.platform}.png`} alt={link.label} width={28} height={28} className="object-contain" />
          </button>
        ))}
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
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">SNSリンク</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              実際のプロフィールでは、X・Instagram・TikTokなどのSNSアカウントへリンクできます。
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
