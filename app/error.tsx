"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8">
        <Image src="/logo.png" alt="KIZALO" width={120} height={36} className="object-contain" />
      </Link>

      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
        <p className="text-5xl font-bold brand-gradient-text mb-4">500</p>
        <p className="text-sm font-semibold text-slate-700 mb-1">エラーが発生しました</p>
        <p className="text-xs text-slate-400 mb-6">しばらく待ってから再度お試しください</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="glass-btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          >
            もう一度試す
          </button>
          <Link href="/" className="text-xs text-slate-400 mt-1">
            トップへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
