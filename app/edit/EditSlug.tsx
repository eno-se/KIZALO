"use client";

import { useState, useTransition } from "react";
import { updateSlug } from "@/app/actions/creator";

export default function EditSlug({ slug, slugChangedAt }: { slug: string; slugChangedAt: Date | null }) {
  const [slugText, setSlugText] = useState(slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSaved, setSlugSaved] = useState(false);
  const [isSlugPending, startSlugTransition] = useTransition();
  const [showWarning, setShowWarning] = useState(false);

  const todayJst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const changedToday = slugChangedAt
    ? new Date(slugChangedAt.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) === todayJst
    : false;

  const confirmSave = () => {
    setShowWarning(false);
    startSlugTransition(async () => {
      const res = await updateSlug(slugText.trim());
      if (res.error) {
        setSlugError(res.error);
      } else {
        setSlugSaved(true);
        setTimeout(() => setSlugSaved(false), 2500);
      }
    });
  };

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-base font-bold text-slate-800 mb-2">IDを変更しますか？</p>
            <p className="text-sm text-slate-500 mb-1">
              <span className="font-semibold text-slate-700">@{slug}</span> → <span className="font-semibold text-slate-700">@{slugText.trim()}</span>
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 my-4">
              <p className="text-xs text-red-600 font-semibold mb-1">⚠️ 注意</p>
              <ul className="text-xs text-red-500 space-y-1 list-disc list-inside">
                <li>旧URL（<span className="font-mono">/{slug}</span>）は即座に404になります</li>
                <li>SNSなどでシェアした既存リンクがすべて無効になります</li>
                <li>変更は1日1回までです</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                キャンセル
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
              >
                変更する
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm gap-1">
        <span className="text-slate-400">@</span>
        <input
          type="text"
          value={slugText}
          onChange={(e) => { setSlugText(e.target.value); setSlugError(null); }}
          disabled={changedToday}
          maxLength={30}
          className="flex-1 bg-transparent focus:outline-none disabled:text-slate-400"
        />
      </div>
      {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
      {changedToday ? (
        <p className="text-xs text-slate-400 mt-1">IDの変更は1日1回までです。明日以降に変更できます。</p>
      ) : (
        <p className="text-xs text-slate-400 mt-1">IDは1日1回まで変更できます。英数字・アンダースコア・ハイフン（3〜30文字）</p>
      )}
      <button
        type="button"
        onClick={() => setShowWarning(true)}
        disabled={isSlugPending || changedToday || slugText.trim() === slug || !slugText.trim()}
        className="glass-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer mt-1"
      >
        {slugSaved ? "変更しました ✓" : isSlugPending ? "変更中..." : "変更する"}
      </button>
    </>
  );
}
