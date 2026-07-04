"use client";

import { useState, useTransition } from "react";
import { updateProfileBio } from "@/app/actions/creator";

export default function EditProfileBio({
  bio,
  bioLink,
  bioLinkLabel,
}: {
  bio: string;
  bioLink: string;
  bioLinkLabel: string;
}) {
  const [bioText, setBioText] = useState(bio);
  const [bioLinkText, setBioLinkText] = useState(bioLink);
  const [bioLinkLabelText, setBioLinkLabelText] = useState(bioLinkLabel);

  const hasChanges = bioText !== bio || bioLinkText !== bioLink || bioLinkLabelText !== bioLinkLabel;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateProfileBio(bioText, bioLinkText.trim(), bioLinkLabelText.trim());
      if (res?.error) { setError(res.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 一言 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">自己紹介</label>
        <textarea
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          rows={4}
          maxLength={200}
          placeholder="自己紹介を入力..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <p className="text-right text-xs text-slate-300 mt-1">{bioText.length}/200</p>
      </div>

      {/* 一言リンク */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">プロフリンク</label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={bioLinkLabelText}
            onChange={(e) => setBioLinkLabelText(e.target.value)}
            placeholder="タイトル（例：グッズはこちら）"
            maxLength={30}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <input
            type="url"
            value={bioLinkText}
            onChange={(e) => setBioLinkText(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">タイトルを設定するとリンクにその文字が表示されます。未設定の場合はURLがそのまま表示されます。</p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {hasChanges && !saved && (
        <p className="text-xs text-center brand-gradient-text font-semibold">保存するボタンを押すまで反映されません</p>
      )}
      <button
        type="submit"
        disabled={isPending || !hasChanges}
        className="glass-btn-primary w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 cursor-pointer"
      >
        {saved ? "保存しました ✓" : isPending ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
