"use client";

import { useState, useTransition } from "react";
import { kizaru } from "@/app/actions/kizari";
import { useRouter } from "next/navigation";

type Props = {
  creatorId: string;
  slug: string;
  alreadyKizared: boolean;
  isLoggedIn: boolean;
  streakDays: number;
};

export default function KizaruButton({ creatorId, slug, alreadyKizared, isLoggedIn, streakDays }: Props) {
  const [done, setDone] = useState(alreadyKizared);
  const [error, setError] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(streakDays);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="glass-btn-primary w-full py-4 rounded-2xl font-bold text-center text-sm block"
      >
        ログインして名前をキザる
      </a>
    );
  }

  if (done) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center">
        <div className="text-2xl mb-1">✓</div>
        <p className="text-sm font-semibold text-violet-700">今日はキザり済み！</p>
        {currentStreak > 0 && (
          <p className="text-xs text-slate-500 mt-1">{currentStreak}日連続応援中</p>
        )}
        <a href="/me" className="mt-3 inline-block text-xs text-violet-400 underline">
          キザりカードを見る
        </a>
      </div>
    );
  }

  const handleKizaru = () => {
    setError(null);
    startTransition(async () => {
      const result = await kizaru(creatorId, slug);
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
        setCurrentStreak((s) => s + 1);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleKizaru}
        disabled={isPending}
        className="glass-btn-primary w-full py-4 rounded-2xl font-bold text-sm cursor-pointer disabled:opacity-50"
      >
        {isPending ? "キザり中..." : "名前をキザる"}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
