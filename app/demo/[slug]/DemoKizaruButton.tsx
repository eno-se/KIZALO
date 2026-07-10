"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  buttonText: string;
  creatorName: string;
};

export default function DemoKizaruButton({ buttonText, creatorName }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 pt-4">
        <div className="max-w-lg mx-auto flex justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="glass-btn-primary px-10 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2"
          >
            <Image src="/kizaru-icon.png" alt="" width={18} height={18} className="object-contain" />
            {buttonText}
          </button>
        </div>
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
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 leading-relaxed">
              {creatorName}はデモキャラクターです
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              KIZALOに登録すると、好きな推しのプロフィールに毎日1回名前を刻めます。
            </p>
            <a
              href="/login"
              className="block glass-btn-primary px-6 py-3 rounded-full font-bold text-sm text-center mb-4"
            >
              無料ではじめる
            </a>
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
