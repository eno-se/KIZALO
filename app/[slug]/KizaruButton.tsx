"use client";

import { useState, useTransition } from "react";
import { kizaru } from "@/app/actions/kizari";
import Image from "next/image";

type Props = {
  creatorId: string;
  slug: string;
  alreadyKizared: boolean;
  isLoggedIn: boolean;
  streakDays: number;
  onKizaruDone?: () => void;
};

const PARTICLES = [
  { angle: 270, color: "#F58BCB" },
  { angle: 315, color: "#B98AF5" },
  { angle: 0,   color: "#7DB7FF" },
  { angle: 45,  color: "#F58BCB" },
  { angle: 90,  color: "#B98AF5" },
  { angle: 135, color: "#7DB7FF" },
  { angle: 180, color: "#F58BCB" },
  { angle: 225, color: "#B98AF5" },
];

export default function KizaruButton({ creatorId, slug, alreadyKizared, isLoggedIn, streakDays, onKizaruDone }: Props) {
  const [done, setDone] = useState(alreadyKizared);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [bouncing, setBouncing] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [floating, setFloating] = useState(false);
  const [streakFloating, setStreakFloating] = useState(false);
  const [floatedStreak, setFloatedStreak] = useState(0);
  const [floatedIsNewRecord, setFloatedIsNewRecord] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="flex justify-center">
        <a
          href={`/login?callbackUrl=/${slug}`}
          className="glass-btn-primary px-10 py-3.5 rounded-full font-bold text-center text-sm flex items-center justify-center gap-2"
        >
          <Image src="/kizaru-icon.png" alt="" width={18} height={18} className="object-contain" />名前を刻る
        </a>
      </div>
    );
  }

  const handleKizaru = () => {
    setError(null);
    setBouncing(true);
    setTimeout(() => setBouncing(false), 420);

    startTransition(async () => {
      const result = await kizaru(creatorId, slug);
      if ('error' in result) {
        setError(result.error ?? null);
      } else {
        setDone(true);
        setBursting(true);
        setFloating(true);
        setTimeout(() => setBursting(false), 700);
        setTimeout(() => setFloating(false), 850);

        if (result.newStreak >= 2) {
          setFloatedStreak(result.newStreak);
          setFloatedIsNewRecord(result.isNewRecord);
          setTimeout(() => {
            setStreakFloating(true);
            setTimeout(() => setStreakFloating(false), 1100);
          }, 450);
        }

        onKizaruDone?.();
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: "relative", display: "inline-block" }}>
        {done ? (
          <button
            disabled
            className="glass-btn-secondary px-10 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 opacity-90 cursor-default"
          >
            <Image
              src="/kizaru-icon.png"
              alt=""
              width={18}
              height={18}
              className="object-contain"
              style={{ filter: "brightness(0) saturate(100%) invert(52%) sepia(15%) saturate(800%) hue-rotate(230deg)" }}
            />
            刻り済み
          </button>
        ) : (
          <button
            onClick={handleKizaru}
            disabled={isPending}
            className={`glass-btn-primary px-10 py-3.5 rounded-full font-bold text-sm cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2 ${bouncing ? "kizaru-bounce" : ""}`}
          >
            {isPending ? (
              <>
                <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                刻り中...
              </>
            ) : (
              <>
                <Image src="/kizaru-icon.png" alt="" width={18} height={18} className="object-contain" />
                名前を刻る
              </>
            )}
          </button>
        )}

        {/* パーティクル */}
        {bursting && PARTICLES.map((p, i) => (
          <span
            key={i}
            className="kizaru-particle"
            style={{
              "--dx": `${Math.cos((p.angle * Math.PI) / 180) * 52}px`,
              "--dy": `${Math.sin((p.angle * Math.PI) / 180) * 52}px`,
              background: p.color,
            } as React.CSSProperties}
          />
        ))}

        {/* +1 フロートアップ */}
        {floating && (
          <span className="kizaru-float-up text-xs font-bold brand-gradient-text" style={{ bottom: "100%", marginBottom: 4 }}>
            +1 刻った！
          </span>
        )}

        {/* 連続記録フロートアップ（done後も同じ wrapper 内に残すことで表示される） */}
        {streakFloating && (
          <span
            className={`kizaru-streak-up text-sm font-bold ${floatedIsNewRecord ? "kizaru-streak-record" : ""}`}
            style={{ bottom: "100%", marginBottom: 4 }}
          >
            {floatedIsNewRecord ? "✨" : "🔥"} {floatedStreak}日連続{floatedIsNewRecord ? "・最高更新！" : "！"}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
