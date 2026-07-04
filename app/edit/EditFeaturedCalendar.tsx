"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { updateFeaturedCalendar } from "@/app/actions/creator";
import { extractTimeTreeEmbedUrl } from "@/lib/timetree";

export default function EditFeaturedCalendar({
  featuredCalendarUrl,
  featuredCalendarTitle,
  featuredCalendarCaption,
}: {
  featuredCalendarUrl: string | null;
  featuredCalendarTitle: string | null;
  featuredCalendarCaption: string | null;
}) {
  const [url, setUrl] = useState(featuredCalendarUrl ?? "");
  const [title, setTitle] = useState(featuredCalendarTitle ?? "");
  const [caption, setCaption] = useState(featuredCalendarCaption ?? "");
  const [savedUrl, setSavedUrl] = useState(featuredCalendarUrl ?? "");
  const [savedTitle, setSavedTitle] = useState(featuredCalendarTitle ?? "");
  const [savedCaption, setSavedCaption] = useState(featuredCalendarCaption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    url.trim() !== savedUrl ||
    title.trim() !== savedTitle ||
    caption.trim() !== savedCaption;

  const embedUrl = extractTimeTreeEmbedUrl(url.trim());

  const handleUrlChange = (val: string) => {
    setUrl(val);
    setError(null);
    setIframeLoaded(false);
  };

  const handleSave = () => {
    if (url.trim() && !embedUrl) {
      setError("TimeTree の公開カレンダー URL を正しく入力してください");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateFeaturedCalendar({
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
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">TimeTree 公開カレンダー URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://timetreeapp.com/public_calendars/..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <p className="text-xs text-slate-400 mt-1">
          TimeTree の公開カレンダーページの URL を貼り付けてください。空欄で削除。
        </p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* プレビュー */}
      {embedUrl && (
        <div className="rounded-xl overflow-hidden relative" style={{ height: 500 }}>
          {!iframeLoaded && (
            <div className="absolute inset-0 rounded-xl bg-slate-100 flex items-center justify-center">
              <Image src="/loading.gif" alt="読み込み中" width={48} height={48} unoptimized />
            </div>
          )}
          <iframe
            key={embedUrl}
            src={embedUrl}
            height={500}
            allow="autoplay"
            className="w-full border-0"
            title="TimeTree カレンダー"
            style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
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
        <p className="text-xs text-center text-amber-500 font-semibold">URL が設定されていないと、タイトル・文章は公開されません</p>
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
