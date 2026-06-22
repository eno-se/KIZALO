"use client";

import { useState } from "react";
import Image from "next/image";

type Fan = {
  id: string;
  totalKizari: number;
  streakDays: number;
  fan: {
    displayName: string | null;
    name: string | null;
    image: string | null;
  };
};

type Following = {
  id: string;
  totalKizari: number;
  streakDays: number;
  creator: {
    slug: string;
    displayName: string;
    iconUrl: string | null;
  };
};

type Props = {
  fans: Fan[];
  following: Following[];
};

export default function DashboardTabs({ fans, following }: Props) {
  const [tab, setTab] = useState<"kizamareta" | "kizanda">("kizamareta");

  return (
    <div className="space-y-4">
      {/* スイッチ */}
      <div className="glass-card rounded-2xl p-1 flex">
        <button
          onClick={() => setTab("kizamareta")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            tab === "kizamareta"
              ? "glass-btn-primary"
              : "text-slate-400"
          }`}
        >
          刻まれた
        </button>
        <button
          onClick={() => setTab("kizanda")}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            tab === "kizanda"
              ? "glass-btn-primary"
              : "text-slate-400"
          }`}
        >
          刻んだ
        </button>
      </div>

      {/* 刻まれた */}
      {tab === "kizamareta" && (
        <div className="glass-card rounded-2xl p-5">
          {fans.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">まだ刻まれていません</p>
          ) : (
            <div className="space-y-3">
              {fans.map((f) => {
                const name = f.fan.displayName ?? f.fan.name ?? "名無し";
                return (
                  <div key={f.id} className="flex items-center gap-3">
                    <div className="rounded-full overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32 }}>
                      <span className="text-sm font-bold text-[#F58BCB]">{name[0]}</span>
                    </div>
                    <span className="text-sm text-slate-700 flex-1 truncate">{name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">累計 {f.totalKizari}回 / {f.streakDays}日連続</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 刻んだ */}
      {tab === "kizanda" && (
        <div className="glass-card rounded-2xl p-5">
          {following.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">まだ誰も刻っていません</p>
          ) : (
            <div className="space-y-3">
              {following.map((f) => (
                <a key={f.id} href={`/${f.creator.slug}`} className="flex items-center gap-3">
                  <div className="rounded-full overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center" style={{ width: 32, height: 32 }}>
                    {f.creator.iconUrl ? (
                      <Image src={f.creator.iconUrl} alt={f.creator.displayName} width={32} height={32} className="object-cover" style={{ width: 32, height: 32 }} />
                    ) : (
                      <span className="text-sm font-bold text-[#F58BCB]">{f.creator.displayName[0]}</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-700 flex-1 truncate">{f.creator.displayName}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">累計 {f.totalKizari}回 / {f.streakDays}日連続</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
