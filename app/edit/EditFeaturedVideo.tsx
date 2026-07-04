"use client";

import { useState, useTransition } from "react";
import { updateFeaturedVideo } from "@/app/actions/creator";
import { extractYoutubeVideoId } from "@/lib/youtube";

export default function EditFeaturedVideo({
  featuredVideoUrl,
  featuredVideoTitle,
  featuredVideoCaption,
}: {
  featuredVideoUrl: string | null;
  featuredVideoTitle: string | null;
  featuredVideoCaption: string | null;
}) {
  const [url, setUrl] = useState(featuredVideoUrl ?? "");
  const [title, setTitle] = useState(featuredVideoTitle ?? "");
  const [caption, setCaption] = useState(featuredVideoCaption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    url.trim() !== (featuredVideoUrl ?? "") ||
    title.trim() !== (featuredVideoTitle ?? "") ||
    caption.trim() !== (featuredVideoCaption ?? "");

  const videoId = extractYoutubeVideoId(url);

  const handleSave = () => {
    if (url.trim() && !videoId) {
      setError("YouTubeのURLを正しく入力してください");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateFeaturedVideo({
        url: url.trim() || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
      });
      if (res?.error) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      {/* YouTube URL */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">YouTube URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <p className="text-xs text-slate-400 mt-1">youtube.com / youtu.be / Shorts に対応。空欄で削除。</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* プレビュー */}
      {videoId && (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title="プレビュー"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
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
        <p className="text-xs text-center text-amber-500 font-semibold">YouTubeのURLが設定されていないと、タイトル・文章は公開されません</p>
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
