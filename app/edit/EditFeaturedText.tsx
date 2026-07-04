"use client";

import { useState, useTransition } from "react";
import { updateFeaturedText } from "@/app/actions/creator";

export default function EditFeaturedText({
  featuredTextTitle,
  featuredTextCaption,
}: {
  featuredTextTitle: string | null;
  featuredTextCaption: string | null;
}) {
  const [title, setTitle] = useState(featuredTextTitle ?? "");
  const [caption, setCaption] = useState(featuredTextCaption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    title.trim() !== (featuredTextTitle ?? "") ||
    caption.trim() !== (featuredTextCaption ?? "");

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateFeaturedText({
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
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">文章</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="テキストを入力"
          maxLength={2200}
          rows={6}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
        />
        <p className={`text-xs text-right mt-1 ${caption.length >= 2200 ? "text-red-500" : "text-slate-400"}`}>
          {caption.length} / 2200
        </p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

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
