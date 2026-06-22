"use client";

import { useState, useTransition } from "react";
import { kizaru } from "@/app/actions/kizari";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
      <div className="flex justify-center">
        <a
          href="/login"
          className="glass-btn-primary px-10 py-3.5 rounded-full font-bold text-center text-sm flex items-center justify-center gap-2"
        >
          <Image src="/kizaru-icon.png" alt="" width={18} height={18} className="object-contain" />名前を刻る
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          disabled
          className="glass-btn-secondary px-10 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 opacity-90 cursor-default"
        >
          <Image src="/kizaru-icon.png" alt="" width={18} height={18} className="object-contain" style={{ filter: "brightness(0) saturate(100%) invert(52%) sepia(15%) saturate(800%) hue-rotate(230deg)" }} />
          刻り済み
        </button>
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
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleKizaru}
        disabled={isPending}
        className="glass-btn-primary px-10 py-3.5 rounded-full font-bold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Image src="/kizaru-icon.png" alt="" width={18} height={18} className="object-contain" />
        {isPending ? "刻り中..." : "名前を刻る"}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
