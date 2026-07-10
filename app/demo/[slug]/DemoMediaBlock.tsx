"use client";

import { useState } from "react";
import Image from "next/image";

const MEDIA_INFO: Record<string, { label: string; description: string; icon: string }> = {
  youtube: {
    label: "YouTube",
    description: "実際のプロフィールでは、ここにYouTube動画が埋め込まれ、プロフページ上で再生できます。",
    icon: "▶",
  },
  spotify: {
    label: "Spotify",
    description: "実際のプロフィールでは、Spotifyの楽曲やアルバムをプロフページ上で再生できます。",
    icon: "▶",
  },
  applemusic: {
    label: "Apple Music",
    description: "実際のプロフィールでは、Apple Musicの楽曲をプロフページ上で再生できます。",
    icon: "▶",
  },
  timetree: {
    label: "タイムツリー",
    description: "実際のプロフィールでは、タイムツリーのスケジュールカレンダーをプロフページ上に表示できます。",
    icon: "📅",
  },
};

type Props = {
  mediaType: string;
  imageUrl: string;
  title: string;
};

export default function DemoMediaBlock({ mediaType, imageUrl, title }: Props) {
  const [showModal, setShowModal] = useState(false);
  const info = MEDIA_INFO[mediaType] ?? { label: mediaType, description: "" };

  return (
    <>
      <div
        className="glass-card rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        {title && (
          <h2 className="relative z-[1] text-xs font-bold brand-gradient-text text-center pt-4 pb-3 flex items-center justify-center gap-1.5">
            <span className="sparkle" />{title}<span className="sparkle" />
          </h2>
        )}
        <Image
          src={imageUrl}
          alt={title}
          width={600}
          height={400}
          className="relative z-[1] w-full h-auto"
          unoptimized
        />
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
            <div className="text-2xl mb-3">{info.icon}</div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">{info.label}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">{info.description}</p>
            <button onClick={() => setShowModal(false)} className="text-xs text-slate-400">
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
