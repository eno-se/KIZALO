"use client";

import { useState, useTransition } from "react";
import { updateFeaturedMusic } from "@/app/actions/creator";
import Image from "next/image";
import { extractAppleMusicEmbedUrl, getAppleMusicEmbedHeight } from "@/lib/apple-music";

export default function EditFeaturedMusic({
  featuredMusicUrl,
  featuredMusicTitle,
  featuredMusicCaption,
}: {
  featuredMusicUrl: string | null;
  featuredMusicTitle: string | null;
  featuredMusicCaption: string | null;
}) {
  const [url, setUrl] = useState(featuredMusicUrl ?? "");
  const [title, setTitle] = useState(featuredMusicTitle ?? "");
  const [caption, setCaption] = useState(featuredMusicCaption ?? "");
  const [savedUrl, setSavedUrl] = useState(featuredMusicUrl ?? "");
  const [savedTitle, setSavedTitle] = useState(featuredMusicTitle ?? "");
  const [savedCaption, setSavedCaption] = useState(featuredMusicCaption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    url.trim() !== savedUrl ||
    title.trim() !== savedTitle ||
    caption.trim() !== savedCaption;

  const embedUrl = extractAppleMusicEmbedUrl(url.trim());
  const embedHeight = embedUrl ? getAppleMusicEmbedHeight(embedUrl) : 450;

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setError(null);
    setIframeLoaded(false);
  };

  const handleSave = () => {
    if (url.trim() && !embedUrl) {
      setError("Apple Music の URL を正しく入力してください");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateFeaturedMusic({
        url: url.trim() || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
      });
      if (res?.error) { setError(res.error); return; }
      setSavedUrl(url.trim());
      setSavedTitle(title.trim());
      setSavedCaption(caption.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      {/* URL */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Apple Music URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://music.apple.com/jp/album/..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <p className="text-xs text-slate-400 mt-1">楽曲・アルバム・プレイリスト・アーティストページのURLに対応。空欄で削除。</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* プレビュー */}
      {embedUrl && (
        <div className="rounded-xl overflow-hidden relative" style={{ height: embedHeight }}>
          {!iframeLoaded && (
            <div
              className="absolute inset-0 rounded-xl bg-slate-100 flex items-center justify-center"
              style={{ height: embedHeight }}
            >
              <Image src="/loading.gif" alt="読み込み中" width={48} height={48} unoptimized />
            </div>
          )}
          <iframe
            key={embedUrl}
            src={embedUrl}
            height={embedHeight}
            allow="autoplay *; encrypted-media *; fullscreen *"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            className="w-full border-0"
            style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            title="Apple Music プレビュー"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      )}

      {/* タイトル */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">タイトル（任意）</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトルを入力"
          maxLength={50}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <p className={`text-xs text-right mt-1 ${title.length >= 50 ? "text-red-500" : "text-slate-400"}`}>
          {title.length} / 50
        </p>
      </div>

      {/* 文章 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">文章（任意）</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="テキストを入力"
          maxLength={2200}
          rows={5}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
        />
        <p className={`text-xs text-right mt-1 ${caption.length >= 2200 ? "text-red-500" : "text-slate-400"}`}>
          {caption.length} / 2200
        </p>
      </div>

      {!url.trim() && (title.trim() || caption.trim()) && (
        <p className="text-xs text-center text-amber-500 font-semibold">Apple Music の URL が設定されていないと、タイトル・文章は公開されません</p>
      )}
      {hasChanges && !saved && (
        <p className="text-xs text-center brand-gradient-text font-semibold">保存するボタンを押すまで反映されません</p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || !hasChanges}
        className="glass-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
      >
        {saved ? "保存しました ✓" : isPending ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
